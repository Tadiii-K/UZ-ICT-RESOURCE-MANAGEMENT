-- UZ ICT RMS - Database Updates
-- Run this in your Supabase SQL Editor AFTER the initial schema.sql

-- =====================================================
-- SOFTWARE ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS software_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    version VARCHAR(100),
    license_key TEXT,
    license_type VARCHAR(100) DEFAULT 'perpetual' CHECK (license_type IN ('perpetual', 'subscription', 'open_source', 'freeware')),
    total_seats INTEGER,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'discontinued')),
    purchase_date DATE,
    license_expiry DATE,
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SERVICE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    request_type VARCHAR(100) NOT NULL DEFAULT 'other' CHECK (request_type IN ('new_equipment', 'repair', 'software', 'network', 'support', 'other')),
    description TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'fulfilled')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_software_assets_status ON software_assets(status);
CREATE INDEX IF NOT EXISTS idx_software_assets_department ON software_assets(department_id);
CREATE INDEX IF NOT EXISTS idx_software_assets_expiry ON software_assets(license_expiry);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_department ON service_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_requested_by ON service_requests(requested_by);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE TRIGGER update_software_assets_updated_at BEFORE UPDATE ON software_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE software_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Software Assets: everyone can view; admins/technicians can manage
CREATE POLICY "Software assets viewable by all authenticated users" ON software_assets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Software assets manageable by admins and technicians" ON software_assets
    FOR ALL TO authenticated
    USING (get_user_role() IN ('admin', 'technician'));

-- Service Requests: all users can view and create; admins/techs can update; admins can delete
CREATE POLICY "Service requests viewable by all authenticated users" ON service_requests
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service requests can be created by all authenticated users" ON service_requests
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service requests updatable by admins, technicians, or requester" ON service_requests
    FOR UPDATE TO authenticated
    USING (get_user_role() IN ('admin', 'technician') OR requested_by = auth.uid());

CREATE POLICY "Service requests deletable by admins" ON service_requests
    FOR DELETE TO authenticated
    USING (get_user_role() = 'admin');

-- =====================================================
-- ALLOCATIONS TABLE - Add missing fields from Chapter 7 design
-- =====================================================
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS return_date DATE;
ALTER TABLE allocations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_allocations_status ON allocations(status);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON software_assets TO authenticated;
GRANT ALL ON service_requests TO authenticated;
