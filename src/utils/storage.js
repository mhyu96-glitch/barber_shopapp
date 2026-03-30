// ========================================
// Storage Utility - Hybrid Local-First + Supabase
// ========================================

import { supabase } from './supabaseClient.js';

const STORAGE_PREFIX = 'barberpro_';
const SUPABASE_COLLECTIONS = ['services', 'barbers', 'customers', 'appointments', 'payments', 'gallery', 'promos', 'holidays', 'inventory', 'expenses', 'attendance', 'profiles', 'settings'];
const SHOP_SCOPED_TABLES = ['services', 'barbers', 'customers', 'appointments', 'payments', 'inventory', 'expenses', 'attendance', 'profiles', 'settings'];

export function getShopId() {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + 'shopId');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

const ALLOWED_COLUMNS = {
    services: ['id', 'name', 'price', 'duration', 'description', 'icon', 'category', 'consumables', 'shop_id'],
    barbers: ['id', 'name', 'phone', 'specialization', 'rating', 'total_ratings', 'work_days', 'work_start', 'work_end', 'avatar', 'bio', 'base_salary', 'commission_rate', 'shop_id'],
    customers: ['id', 'name', 'phone', 'email', 'avatar', 'total_appointments', 'total_spent', 'last_visit', 'notes', 'tags', 'loyalty_points', 'member_since', 'shop_id'],
    appointments: ['id', 'barber_id', 'customer_id', 'service_id', 'date', 'time', 'status', 'total_price', 'price', 'source', 'notes', 'shop_id'],
    payments: ['id', 'appointment_id', 'amount', 'method', 'status', 'reference', 'date', 'customer_id', 'customer_name', 'shop_id'],
    inventory: ['id', 'name', 'category', 'stock', 'unit', 'min_stock', 'price', 'last_restock', 'shop_id'],
    expenses: ['id', 'date', 'category', 'amount', 'description', 'barber_id', 'is_recurring', 'shop_id'],
    attendance: ['id', 'profile_id', 'date', 'check_in', 'check_out', 'status', 'notes', 'shop_id'],
    profiles: ['id', 'full_name', 'username', 'role', 'avatar_url', 'shop_id'],
    settings: ['id', 'shop_name', 'address', 'phone', 'email', 'currency', 'opening_hours', 'active_branch_id', 'branches', 'shop_id']
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

        const dbTable = collection;
        if (SUPABASE_COLLECTIONS.includes(dbTable)) {
            const row = { ...item };
            const dbData = this.toSnakeCaseObj(row);
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
        console.log('Syncing from Supabase...');
        const shopId = getShopId();
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync Timeout')), 5000));
        
        try {
            await Promise.race([
                (async () => {
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
                    const settingsQuery = shopId 
                        ? supabase.from('settings').select('*').eq('shop_id', shopId).limit(1)
                        : supabase.from('settings').select('*').limit(1);
                    const { data: settingsData, error: settingsError } = await settingsQuery;
                    if (!settingsError && settingsData?.[0]) {
                        this.set('settings', this.toCamelCaseObj(settingsData[0]));
                    }

                    if (shopId) {
                        const { data: shopPlData } = await supabase
                            .from('shops')
                            .select('*, subscription_plans!plan_id(features, name, max_barbers, max_branches)')
                            .eq('id', shopId)
                            .single();
                        
                        if (shopPlData && shopPlData.subscription_plans) {
                            const dbFeatures = shopPlData.subscription_plans.features || {};
                            
                            // 🚀 Feature Translation Engine: Convert JSONB Object to Flat Array
                            // Sidebar logic expects ['feature1', 'feature2']
                            let activeFeatures = ['dashboard', 'appointments', 'customers', 'services', 'portal']; // Base set
                            
                            if (typeof dbFeatures === 'object' && !Array.isArray(dbFeatures)) {
                                Object.keys(dbFeatures).forEach(key => {
                                    if (dbFeatures[key] === true) activeFeatures.push(key);
                                });
                            } else if (Array.isArray(dbFeatures)) {
                                activeFeatures = [...new Set([...activeFeatures, ...dbFeatures])];
                            }

                            const constraints = {
                                maxBarbers: shopPlData.subscription_plans.max_barbers || null,
                                maxBranches: shopPlData.subscription_plans.max_branches || null
                            };
                            
                            this.set('active_features', activeFeatures);
                            this.set('shop_plan', shopPlData.subscription_plans.name || 'Trial');
                            this.set('shop_status', shopPlData.status);
                            this.set('shop_constraints', constraints);
                            console.log(`Synced Shop Plan: ${shopPlData.subscription_plans.name}, Features:`, activeFeatures);
                        } else if (shopPlData) {
                            // 🛰️ FAIL-SAFE: If metadata join fails (RLS), fallback to local feature map based on text 'plan' column
                            const legacyPlan = (shopPlData.plan || 'trial').toLowerCase();
                            this.set('shop_plan', legacyPlan.charAt(0).toUpperCase() + legacyPlan.slice(1));
                            this.set('shop_status', shopPlData.status);
                            
                            let activeFeatures = ['dashboard', 'appointments', 'customers', 'services', 'portal'];
                            
                            // Elevate features based on legacy plan strings
                            if (legacyPlan === 'enterprise' || legacyPlan === 'ultimate' || legacyPlan === 'pro') {
                                activeFeatures = [...activeFeatures, 'queue', 'barbers', 'attendance', 'pos', 'reports', 'inventory'];
                            }
                            
                            this.set('active_features', activeFeatures);
                            console.warn(`Join failed. Used legacy fail-safe for plan: ${legacyPlan}`);
                        }
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
            const user = this.getCurrentUser();
            if (user?.role === 'superadmin') {
                console.log('Migration skipped: SuperAdmin context.');
                return;
            }

            await Promise.race([
                (async () => {
                    for (const col of SUPABASE_COLLECTIONS) {
                        const localData = this.get(col, []);
                        if (localData.length === 0) continue;

                        const { count, error } = await supabase.from(col).select('*', { count: 'exact', head: true });
                        if (!error && count === 0) {
                            console.log(`Migrating ${localData.length} items for ${col}...`);
                            const dbData = localData.map(item => {
                                const row = this.toSnakeCaseObj(item);
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
