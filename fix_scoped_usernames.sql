-- Migration: Scoped Usernames for Multi-Tenancy
-- Removes global uniqueness for username, replaces with (shop_id, username) pair

-- 1. Identify and Drop the existing unique constraint on username
-- We use a DO block to find the constraint name dynamically if it's not the default
DO $$ 
DECLARE 
    constraint_name_val TEXT;
BEGIN
    SELECT conname INTO constraint_name_val
    FROM pg_constraint 
    WHERE conrelid = 'profiles'::regclass AND contype = 'u' AND confkey IS NULL;
    
    IF constraint_name_val IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name_val;
    END IF;
END $$;

-- 2. Ensure shop_id is not null for non-super-admins (best practice)
-- (Skipped for now to avoid breaking existing data if any shop_id is missing)

-- 3. Add the new composite unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_shop_id_username_key UNIQUE (shop_id, username);

-- 4. Verify RLS (Ensuring shop_id filtering is robust)
-- (Already handled in previous migrations, but good to keep in mind)
