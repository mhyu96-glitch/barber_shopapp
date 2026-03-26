// ========================================
// Storage Utility - Hybrid Local-First + Supabase
// ========================================

import { supabase } from './supabaseClient.js';

const STORAGE_PREFIX = 'barberpro_';
const SUPABASE_COLLECTIONS = ['services', 'barbers', 'customers', 'appointments', 'payments', 'gallery', 'promos', 'holidays', 'inventory', 'expenses', 'attendance_logs', 'settings'];

const ALLOWED_COLUMNS = {
    services: ['id', 'name', 'price', 'duration', 'description', 'icon', 'category', 'consumables'],
    barbers: ['id', 'name', 'phone', 'specialization', 'rating', 'total_ratings', 'work_days', 'work_start', 'work_end', 'avatar', 'bio', 'base_salary', 'commission_rate'],
    customers: ['id', 'name', 'phone', 'email', 'avatar', 'total_appointments', 'total_spent', 'last_visit', 'notes', 'tags', 'loyalty_points', 'member_since'],
    appointments: ['id', 'barber_id', 'customer_id', 'service_id', 'date', 'time', 'status', 'total_price', 'source', 'notes'],
    payments: ['id', 'appointment_id', 'amount', 'method', 'status', 'reference', 'date'],
    inventory: ['id', 'name', 'category', 'stock', 'unit', 'min_stock', 'price', 'last_restock'],
    expenses: ['id', 'date', 'category', 'amount', 'description', 'barber_id', 'is_recurring'],
    attendance_logs: ['id', 'barber_id', 'date', 'clock_in', 'clock_out', 'status', 'notes'],
    settings: ['id', 'shop_name', 'address', 'phone', 'email', 'currency', 'opening_hours', 'active_branch_id', 'branches']
};

export const storage = {
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(STORAGE_PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(STORAGE_PREFIX + key);
    },

    getAll(collection) {
        const items = this.get(collection, []);
        const settings = this.get('settings', {});
        const activeBranch = settings.activeBranchId;

        const branchSensitive = ['appointments', 'payments', 'inventory', 'expenses', 'attendance'];
        if (activeBranch && branchSensitive.includes(collection)) {
            return items.filter(item => item.branchId === activeBranch);
        }
        return items;
    },

    add(collection, item) {
        const allItems = this.get(collection, []); 
        const settings = this.get('settings', {});

        item.id = item.id || this.generateId();
        item.createdAt = item.createdAt || new Date().toISOString();
        item.updatedAt = new Date().toISOString();

        const branchSensitive = ['appointments', 'payments', 'inventory', 'expenses', 'attendance'];
        if (settings.activeBranchId && branchSensitive.includes(collection)) {
            item.branchId = settings.activeBranchId;
        }

        allItems.push(item);
        this.set(collection, allItems);

        // Async Sync to Supabase
        // Async Sync to Supabase
        const dbTable = collection === 'attendanceLogs' ? 'attendance_logs' : collection;
        if (SUPABASE_COLLECTIONS.includes(dbTable)) {
            const row = { ...item };
            // Convert camelCase to snake_case if necessary, or let Supabase map it if columns match
            // We assume matching schema (schema uses snake_case, JS uses camelCase)
            const dbData = this.toSnakeCaseObj(row);
            // Drop fields that don't exist in Supabase DB
            if (dbData.created_at) delete dbData.created_at; 
            supabase.from(dbTable).insert([dbData]).then(({error}) => {
                if(error) console.error('Supabase Insert Error:', error);
            });
        }

        return item;
    },

    update(collection, id, updates) {
        const allItems = this.get(collection, []);
        const index = allItems.findIndex(i => i.id === id);
        if (index !== -1) {
            allItems[index] = { ...allItems[index], ...updates, updatedAt: new Date().toISOString() };
            this.set(collection, allItems);

            // Async Sync to Supabase
            const dbTable = collection === 'attendanceLogs' ? 'attendance_logs' : collection;
            if (SUPABASE_COLLECTIONS.includes(dbTable)) {
                const dbUpdates = this.toSnakeCaseObj(updates);
                supabase.from(dbTable).update(dbUpdates).eq('id', id).then(({error}) => {
                    if(error) console.error('Supabase Update Error:', error);
                });
            }

            return allItems[index];
        }
        return null;
    },

    delete(collection, id) {
        const allItems = this.get(collection, []);
        const filtered = allItems.filter(i => i.id !== id);
        this.set(collection, filtered);

        // Async Sync to Supabase
        const dbTable = collection === 'attendanceLogs' ? 'attendance_logs' : collection;
        if (SUPABASE_COLLECTIONS.includes(dbTable)) {
            supabase.from(dbTable).delete().eq('id', id).then(({error}) => {
                if(error) console.error('Supabase Delete Error:', error);
            });
        }
    },

    find(collection, id) {
        return this.getAll(collection).find(i => i.id === id) || null;
    },

    generateId() {
        return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // --- Supabase Hybrid Methods ---
    async syncFromSupabase() {
        console.log('Syncing from Supabase...');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync Timeout')), 5000));
        
        try {
            await Promise.race([
                (async () => {
                    for (const col of SUPABASE_COLLECTIONS) {
                        const { data, error } = await supabase.from(col).select('*');
                        if (!error && data) {
                            const mappedData = data.map(d => this.toCamelCaseObj(d));
                            let storageKey = col === 'attendance_logs' ? 'attendanceLogs' : col;
                            this.set(storageKey, mappedData);
                        }
                    }
                    const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').limit(1);
                    if (!settingsError && settingsData?.[0]) {
                        this.set('settings', this.toCamelCaseObj(settingsData[0]));
                    }
                    window.dispatchEvent(new Event('supabase-synced'));
                })(),
                timeout
            ]);
        } catch (err) {
            console.warn('Sync failed or timed out:', err);
        }
    },

    async migrateLocalToSupabase() {
        console.log('Checking for local data migration...');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Migration Timeout')), 5000));
        
        try {
            await Promise.race([
                (async () => {
                    for (const col of SUPABASE_COLLECTIONS) {
                        const storageKey = col === 'attendance_logs' ? 'attendanceLogs' : col;
                        const localData = this.get(storageKey, []);
                        if (localData.length === 0) continue;

                        const { count, error } = await supabase.from(col).select('*', { count: 'exact', head: true });
                        if (!error && count === 0) {
                            console.log(`Migrating ${localData.length} items for ${col}...`);
                            const dbData = localData.map(item => {
                                const row = this.toSnakeCaseObj(item);
                                
                                // Filter only allowed columns
                                const filteredRow = {};
                                const allowedCols = ALLOWED_COLUMNS[col] || Object.keys(row);
                                allowedCols.forEach(key => {
                                    if (row[key] !== undefined) filteredRow[key] = row[key];
                                });
                                
                                if (filteredRow.created_at) delete filteredRow.created_at;
                                return filteredRow;
                            });
                            await supabase.from(col).insert(dbData);
                        }
                    }
                })(),
                timeout
            ]);
        } catch (err) {
            console.warn('Migration failed or timed out:', err);
        }
    },

    setupRealtime() {
        supabase.channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                this.syncFromSupabase();
            })
            .subscribe();
    },

    // Utilities to convert DB snake_case to JS camelCase and vice versa
    toCamelCase(str) {
        return str.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
    },
    toSnakeCase(str) {
         return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    },
    toCamelCaseObj(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = {};
        for(const [key, val] of Object.entries(obj)) result[this.toCamelCase(key)] = val;
        return result;
    },
    toSnakeCaseObj(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = {};
        for(const [key, val] of Object.entries(obj)) result[this.toSnakeCase(key)] = val;
        return result;
    }
};
