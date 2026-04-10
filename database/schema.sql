-- UZ ICT Resource Management System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'department_rep' CHECK (role IN ('admin', 'technician', 'department_rep')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ICT Assets Table
CREATE TABLE IF NOT EXISTS ict_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    serial_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'faulty', 'under_maintenance', 'disposed')),
    purchase_date DATE,
    warranty_expiry DATE,
    assigned_user VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fault Reports Table
CREATE TABLE IF NOT EXISTS fault_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES ict_assets(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'closed')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES ict_assets(id) ON DELETE CASCADE,
    fault_report_id UUID REFERENCES fault_reports(id) ON DELETE SET NULL,
    technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    maintenance_type VARCHAR(50) DEFAULT 'corrective' CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
    description TEXT NOT NULL,
    actions_taken TEXT,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allocations Table (Asset Movement History)
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES ict_assets(id) ON DELETE CASCADE,
    from_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    to_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    allocated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ict_assets_status ON ict_assets(status);
CREATE INDEX IF NOT EXISTS idx_ict_assets_department ON ict_assets(department_id);
CREATE INDEX IF NOT EXISTS idx_ict_assets_category ON ict_assets(category_id);
CREATE INDEX IF NOT EXISTS idx_fault_reports_status ON fault_reports(status);
CREATE INDEX IF NOT EXISTS idx_fault_reports_asset ON fault_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_allocations_asset ON allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ict_assets_updated_at BEFORE UPDATE ON ict_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fault_reports_updated_at BEFORE UPDATE ON fault_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ict_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user department
CREATE OR REPLACE FUNCTION get_user_department()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT department_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Departments: Everyone can read, only admins can modify
CREATE POLICY "Departments are viewable by all authenticated users" ON departments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Departments are editable by admins" ON departments
    FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Categories: Everyone can read, only admins can modify
CREATE POLICY "Categories are viewable by all authenticated users" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Categories are editable by admins" ON categories
    FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Profiles: Users can see all profiles, but only admins can modify others
CREATE POLICY "Profiles are viewable by all authenticated users" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- ICT Assets: Admins and technicians can manage, dept reps can view their department's assets
CREATE POLICY "Assets viewable by admins and technicians" ON ict_assets
    FOR SELECT TO authenticated 
    USING (
        get_user_role() IN ('admin', 'technician') 
        OR department_id = get_user_department()
    );

CREATE POLICY "Assets manageable by admins and technicians" ON ict_assets
    FOR ALL TO authenticated 
    USING (get_user_role() IN ('admin', 'technician'));

-- Fault Reports: Admins and technicians see all, dept reps see their department's
CREATE POLICY "Fault reports viewable based on role" ON fault_reports
    FOR SELECT TO authenticated 
    USING (
        get_user_role() IN ('admin', 'technician')
        OR EXISTS (
            SELECT 1 FROM ict_assets 
            WHERE ict_assets.id = fault_reports.asset_id 
            AND ict_assets.department_id = get_user_department()
        )
    );

CREATE POLICY "Fault reports can be created by all authenticated users" ON fault_reports
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Fault reports manageable by admins and technicians" ON fault_reports
    FOR UPDATE TO authenticated 
    USING (get_user_role() IN ('admin', 'technician'));

CREATE POLICY "Fault reports deletable by admins" ON fault_reports
    FOR DELETE TO authenticated 
    USING (get_user_role() = 'admin');

-- Maintenance Records: Admins and technicians can manage
CREATE POLICY "Maintenance records viewable by all authenticated users" ON maintenance_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Maintenance records manageable by admins and technicians" ON maintenance_records
    FOR ALL TO authenticated 
    USING (get_user_role() IN ('admin', 'technician'));

-- Allocations: Admins and technicians can manage
CREATE POLICY "Allocations viewable by all authenticated users" ON allocations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allocations manageable by admins and technicians" ON allocations
    FOR ALL TO authenticated 
    USING (get_user_role() IN ('admin', 'technician'));

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'department_rep'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample departments
INSERT INTO departments (name, code, description) VALUES
    ('Computer Science', 'CS', 'Department of Computer Science'),
    ('Information Systems', 'IS', 'Department of Information Systems'),
    ('Library', 'LIB', 'University Library'),
    ('Administration', 'ADMIN', 'University Administration'),
    ('Engineering', 'ENG', 'Faculty of Engineering'),
    ('ICT Services', 'ICT', 'ICT Services Department')
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
    ('Desktop Computer', 'Desktop PCs and workstations'),
    ('Laptop', 'Portable computers'),
    ('Printer', 'Printers and multifunction devices'),
    ('Network Equipment', 'Routers, switches, and network devices'),
    ('Server', 'Server hardware'),
    ('Monitor', 'Display monitors'),
    ('Projector', 'Projectors and presentation equipment'),
    ('UPS', 'Uninterruptible Power Supplies'),
    ('Scanner', 'Document scanners'),
    ('Other', 'Other ICT equipment')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
