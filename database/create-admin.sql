-- =====================================================
-- CREATE ADMIN USER
-- =====================================================
-- 
-- STEP 1: Create user in Supabase Dashboard
-- -----------------------------------------
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter:
--    - Email: admin@uz.ac.zw (or your preferred email)
--    - Password: YourSecurePassword123!
-- 4. Click "Create user"
--
-- STEP 2: Run this SQL to set the user as admin
-- -----------------------------------------
-- Replace 'admin@uz.ac.zw' with the email you used above

UPDATE profiles 
SET 
    role = 'admin', 
    full_name = 'System Administrator',
    is_active = true
WHERE email = 'admin@uz.ac.zw';

-- Verify the admin was created:
SELECT id, email, full_name, role, is_active 
FROM profiles 
WHERE email = 'admin@uz.ac.zw';

-- =====================================================
-- ALTERNATIVE: Create multiple test users at once
-- =====================================================
-- After creating these users in Supabase Auth Dashboard,
-- run the following to set their roles:

-- UPDATE profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@uz.ac.zw';
-- UPDATE profiles SET role = 'technician', full_name = 'ICT Technician' WHERE email = 'tech@uz.ac.zw';
-- UPDATE profiles SET role = 'department_rep', full_name = 'CS Department Rep', department_id = (SELECT id FROM departments WHERE name = 'Computer Science') WHERE email = 'cs-rep@uz.ac.zw';
