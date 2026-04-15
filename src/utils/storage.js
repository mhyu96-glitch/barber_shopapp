// ========================================
// Storage Utility - Hybrid Local-First + Supabase
// ========================================

import { supabase } from './supabaseClient.js';

const STORAGE_PREFIX = 'barberpro_';
const SUPABASE_COLLECTIONS = ['services', 'barbers', 'customers', 'appointments', 'payments', 'gallery', 'promos', 'holidays', 'inventory', 'expenses', 'attendance', 'profiles', 'settings', 'feedbacks', 'membership_packages', 'customer_memberships', 'loyalty_logs'];
const SHOP_SCOPED_TABLES = ['services', 'barbers', 'customers', 'appointments', 'payments', 'inventory', 'expenses', 'attendance', 'profiles', 'settings', 'feedbacks', 'membership_packages', 'customer_memberships', 'loyalty_logs'];

export function getShopId() {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + 'shopId');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

const ALLOWED_COLUMNS = {
    services: ['id', 'name', 'price', 'duration', 'description', 'icon', 'category', 'consumables', 'shop_id'],
    barbers: ['id', 'name', 'phone', 'specialization', 'rating', 'total_ratings', 'work_days', 'work_start', 'work_end', 'avatar', 'bio', 'base_salary', 'commission_rate', 'commission_type', 'commission_fixed', 'shop_id'],
    customers: ['id', 'name', 'phone', 'email', 'avatar', 'total_appointments', 'total_spent', 'last_visit', 'first_visit', 'notes', 'tags', 'loyalty_points', 'loyalty_tier', 'member_since', 'shop_id'],
    appointments: ['id', 'barber_id', 'customer_id', 'service_id', 'date', 'time', 'status', 'total_price', 'price', 'source', 'notes', 'shop_id'],
    payments: ['id', 'appointment_id', 'barber_id', 'commission_amount', 'amount', 'method', 'status', 'reference', 'date', 'customer_id', 'customer_name', 'shop_id'],
    inventory: ['id', 'name', 'category', 'stock', 'unit', 'min_stock', 'price', 'last_restock', 'shop_id'],
    expenses: ['id', 'date', 'category', 'amount', 'description', 'barber_id', 'is_recurring', 'shop_id'],
    attendance: ['id', 'profile_id', 'date', 'check_in', 'check_out', 'status', 'notes', 'shop_id'],
    profiles: ['id', 'full_name', 'username', 'role', 'avatar_url', 'barber_id', 'shop_id'],
    settings: ['id', 'shop_name', 'address', 'phone', 'email', 'currency', 'opening_hours', 'google_review_link', 'active_branch_id', 'branches', 'shop_id'],
    feedbacks: ['id', 'appointment_id', 'barber_id', 'customer_name', 'rating', 'comment', 'date', 'shop_id'],
    membership_packages: ['id', 'name', 'serviceId', 'serviceName', 'sessions', 'price', 'validDays', 'shop_id'],
    customer_memberships: ['id', 'customer_id', 'package_id', 'remaining_sessions', 'purchase_date', 'expiry_date', 'status', 'shop_id'],
    loyalty_logs: ['id', 'customer_id', 'points', 'type', 'description', 'date', 'shop_id'],
    gallery: ['id', 'title', 'description', 'category', 'url', 'image', 'shop_id'],
    promos: ['id', 'name', 'description', 'type', 'discount', 'startDate', 'endDate', 'active', 'serviceId', 'shop_id']
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

    getCurrentUser() {
        return this.get('currentUser', null);
    },

    setCurrentUser(user) {
        this.set('currentUser', user);
    },

    async logout() {
        try {
            await supabase.auth.signOut();
        } catch (e) { console.warn('Supabase signout failed:', e); }

        this.remove('currentUser');
        this.remove('shopId');
        this.remove('active_features');
        this.remove('shop_plan');
        this.remove('shop_status');
        localStorage.removeItem('supabase.auth.token'); 
        window.location.hash = 'login';
        window.location.reload();
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

        const shopId = getShopId();
        if (shopId && SHOP_SCOPED_TABLES.includes(collection)) {
            item.shopId = shopId;
        }

        allItems.push(item);
        this.set(collection, allItems);

        // Strict Filtering for Supabase
        const dbTable = collection;
        if (SUPABASE_COLLECTIONS.includes(dbTable)) {
            const row = { ...item };
            let dbData = this.toSnakeCaseObj(row);
            
            // Remove calculated or non-existent columns
            const allowed = ALLOWED_COLUMNS[dbTable] || [];
            if (allowed.length > 0) {
                const cleaned = {};
                allowed.forEach(col => {
                    if (dbData[col] !== undefined) cleaned[col] = dbData[col];
                });
                dbData = cleaned;
            }

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

            const dbTable = collection;
            if (SUPABASE_COLLECTIONS.includes(dbTable)) {
                let dbUpdates = this.toSnakeCaseObj(updates);
                
                // Strict Filtering for Updates
                const allowed = ALLOWED_COLUMNS[dbTable] || [];
                if (allowed.length > 0) {
                    const cleaned = {};
                    allowed.forEach(col => {
                        if (dbUpdates[col] !== undefined) cleaned[col] = dbUpdates[col];
                    });
                    dbUpdates = cleaned;
                }

                if (Object.keys(dbUpdates).length > 0) {
                    supabase.from(dbTable).update(dbUpdates).eq('id', id).then(({error}) => {
                        if(error) console.error('Supabase Update Error:', error);
                    });
                }
            }

            return allItems[index];
        }
        return null;
    },

    delete(collection, id) {
        const allItems = this.get(collection, []);
        const filtered = allItems.filter(i => i.id !== id);
        this.set(collection, filtered);

        const dbTable = collection;
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

    async syncFromSupabase() {
        console.log('Syncing from Supabase (Background)...');
        const shopId = getShopId();
        
        try {
            // Background process: iterate and sync
            for (const col of SUPABASE_COLLECTIONS) {
                let query = supabase.from(col).select('*');
                if (shopId && SHOP_SCOPED_TABLES.includes(col)) {
                    query = query.eq('shop_id', shopId);
                }
                const { data, error } = await query;
                if (!error && data) {
                    const mappedData = data.map(d => this.toCamelCaseObj(d));
                    this.set(col, mappedData);
                }
            }
            
            // Sync settings
            const settingsQuery = shopId 
                ? supabase.from('settings').select('*').eq('shop_id', shopId).limit(1)
                : supabase.from('settings').select('*').limit(1);
            const { data: settingsData, error: settingsError } = await settingsQuery;
            if (!settingsError && settingsData?.[0]) {
                this.set('settings', this.toCamelCaseObj(settingsData[0]));
            }

            if (shopId) {
                const { data: shopData } = await supabase.from('shops').select('*').eq('id', shopId).single();
                if (shopData) {
                    const allFeatures = ['dashboard', 'appointments', 'customers', 'services', 'portal', 'queue', 'barbers', 'attendance', 'pos', 'reports', 'inventory', 'promos', 'expenses', 'memberships', 'gallery', 'logbook'];
                    this.set('active_features', allFeatures);
                    this.set('shop_plan', 'Premium Access');
                    this.set('shop_status', shopData.status);
                }
            }
            window.dispatchEvent(new Event('supabase-synced'));
        } catch (err) {
            console.warn('Background sync encountered an issue:', err);
        }
    },

    async migrateLocalToSupabase() {
        console.log('Migration check...');
        try {
            const user = this.getCurrentUser();
            if (!user || user.role === 'superadmin') return;

            for (const col of SUPABASE_COLLECTIONS) {
                const localData = this.get(col, []);
                if (localData.length === 0) continue;

                // Non-blocking attempt per collection
                supabase.from(col).select('*', { count: 'exact', head: true }).then(({ count, error }) => {
                    if (!error && count === 0) {
                        console.log(`Migrating ${localData.length} items for ${col}...`);
                        const dbData = localData.map(item => {
                            const row = this.toSnakeCaseObj(item);
                            const filteredRow = {};
                            const allowedCols = ALLOWED_COLUMNS[col] || Object.keys(row);
                            allowedCols.forEach(key => { if (row[key] !== undefined) filteredRow[key] = row[key]; });
                            if (filteredRow.created_at) delete filteredRow.created_at;
                            return filteredRow;
                        });
                        supabase.from(col).insert(dbData).then(({error}) => {
                            if(error) console.error(`Migration error for ${col}:`, error);
                        });
                    }
                });
            }
        } catch (err) {
            console.warn('Migration encounterd an issue:', err);
        }
    },

    setupRealtime() {
        supabase.channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                this.syncFromSupabase();
                if (payload.table === 'appointments' && payload.eventType === 'INSERT') {
                    const newData = payload.new;
                    if (newData && newData.source === 'portal') {
                        const camelData = this.toCamelCaseObj(newData);
                        window.dispatchEvent(new CustomEvent('new-portal-booking', {
                            detail: camelData
                        }));
                    }
                }
            })
            .subscribe((status) => {
                console.log('Realtime subscription:', status);
            });
    },

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
    },

    async signUp(email, password, fullName, role) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role
                }
            }
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true, user: data.user };
    }
};
