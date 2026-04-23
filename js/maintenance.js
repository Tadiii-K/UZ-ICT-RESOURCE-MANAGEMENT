// Maintenance Module

let assets = [];
let faults = [];

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initMaintenancePage();
        }
    }, 500);
});

async function initMaintenancePage() {
    await Promise.all([
        loadAssetsForDropdown(),
        loadFaultsForDropdown()
    ]);
    await loadMaintenance();
    setupEventListeners();
    setupRoleBasedUI();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadMaintenance(), 300));
    }
    
    ['filterStatus', 'filterType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadMaintenance());
        }
    });
    
    const maintenanceForm = document.getElementById('maintenanceForm');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', handleMaintenanceSubmit);
    }
    
    // Update fault dropdown when asset changes
    const maintenanceAsset = document.getElementById('maintenanceAsset');
    if (maintenanceAsset) {
        maintenanceAsset.addEventListener('change', updateFaultDropdown);
    }
}

function setupRoleBasedUI() {
    if (isAdmin() || isTechnician()) {
        document.querySelectorAll('.technician-only').forEach(el => {
            el.classList.remove('d-none');
        });
    }
}

async function loadAssetsForDropdown() {
    try {
        const { data, error } = await db
            .from('ict_assets')
            .select('id, name, asset_tag')
            .order('name');
        
        if (error) throw error;
        
        assets = data || [];
        
        const maintenanceAsset = document.getElementById('maintenanceAsset');
        if (maintenanceAsset) {
            maintenanceAsset.innerHTML = '<option value="">Select Asset</option>' + 
                assets.map(a => `<option value="${a.id}">${escapeHtml(a.asset_tag)} - ${escapeHtml(a.name)}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Load assets error:', error);
    }
}

async function loadFaultsForDropdown() {
    try {
        const { data, error } = await db
            .from('fault_reports')
            .select('id, asset_id, description, status')
            .in('status', ['reported', 'in_progress'])
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        faults = data || [];
        
    } catch (error) {
        console.error('Load faults error:', error);
    }
}

function updateFaultDropdown() {
    const assetId = document.getElementById('maintenanceAsset').value;
    const maintenanceFault = document.getElementById('maintenanceFault');
    
    if (!maintenanceFault) return;
    
    const assetFaults = faults.filter(f => f.asset_id === assetId);
    
    maintenanceFault.innerHTML = '<option value="">No linked fault</option>' + 
        assetFaults.map(f => `<option value="${f.id}">#${f.id.substring(0, 8)} - ${escapeHtml(truncateText(f.description, 50))}</option>`).join('');
}

async function loadMaintenance() {
    try {
        const tbody = document.getElementById('maintenanceTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';
        
        let query = db
            .from('maintenance_records')
            .select(`
                *,
                ict_assets(name, asset_tag),
                technician:profiles!maintenance_records_technician_id_fkey(full_name)
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        const search = document.getElementById('searchInput')?.value?.trim();
        const status = document.getElementById('filterStatus')?.value;
        const type = document.getElementById('filterType')?.value;
        
        if (search) {
            query = query.or(`description.ilike.%${search}%,actions_taken.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (type) {
            query = query.eq('maintenance_type', type);
        }

        // Department reps can only see maintenance records for their department's assets
        if (isDepartmentRep() && currentProfile.department_id) {
            const { data: deptAssets } = await db
                .from('ict_assets')
                .select('id')
                .eq('department_id', currentProfile.department_id);
            const deptAssetIds = (deptAssets || []).map(a => a.id);
            if (deptAssetIds.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No maintenance records found</td></tr>';
                return;
            }
            query = query.in('asset_id', deptAssetIds);
        }

        const { data: records, error } = await query;
        
        if (error) throw error;
        
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No maintenance records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = records.map(record => `
            <tr>
                <td><span class="fw-medium">#${record.id.substring(0, 8)}</span></td>
                <td>
                    <span class="fw-medium">${escapeHtml(record.ict_assets?.name || 'Unknown')}</span>
                    <br><small class="text-muted">${escapeHtml(record.ict_assets?.asset_tag || '')}</small>
                </td>
                <td><span class="badge ${getStatusBadgeClass(record.maintenance_type)}">${formatStatus(record.maintenance_type)}</span></td>
                <td class="text-truncate" style="max-width: 200px;">${escapeHtml(record.description)}</td>
                <td>${escapeHtml(record.technician?.full_name || '-')}</td>
                <td><span class="badge ${getStatusBadgeClass(record.status)}">${formatStatus(record.status)}</span></td>
                <td><small>${formatDate(record.scheduled_date || record.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewMaintenance('${record.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${isAdmin() || isTechnician() ? `
                        <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editMaintenance('${record.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load maintenance error:', error);
        document.getElementById('maintenanceTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center text-danger py-4">Error loading maintenance records</td></tr>';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterType').value = '';
    loadMaintenance();
}

function openAddMaintenanceModal() {
    document.getElementById('maintenanceModalTitle').textContent = 'New Maintenance Record';
    document.getElementById('maintenanceForm').reset();
    document.getElementById('maintenanceId').value = '';
    document.getElementById('maintenanceStatus').value = 'scheduled';
    document.getElementById('maintenanceType').value = 'corrective';
    document.getElementById('maintenanceFault').innerHTML = '<option value="">No linked fault</option>';
    const modal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
    modal.show();
}

async function editMaintenance(id) {
    try {
        showLoading(true);
        
        const { data: record, error } = await db
            .from('maintenance_records')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('maintenanceModalTitle').textContent = 'Edit Maintenance Record';
        document.getElementById('maintenanceId').value = record.id;
        document.getElementById('maintenanceAsset').value = record.asset_id || '';
        document.getElementById('maintenanceType').value = record.maintenance_type || 'corrective';
        document.getElementById('maintenanceStatus').value = record.status || 'scheduled';
        document.getElementById('maintenanceScheduledDate').value = record.scheduled_date || '';
        document.getElementById('maintenanceCompletedDate').value = record.completed_date || '';
        document.getElementById('maintenanceCost').value = record.cost || '';
        document.getElementById('maintenanceDescription').value = record.description || '';
        document.getElementById('maintenanceActions').value = record.actions_taken || '';
        
        // Update fault dropdown for selected asset
        updateFaultDropdown();
        if (record.fault_report_id) {
            document.getElementById('maintenanceFault').value = record.fault_report_id;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
        modal.show();
        
    } catch (error) {
        console.error('Edit maintenance error:', error);
        showAlert('Error loading maintenance details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function viewMaintenance(id) {
    try {
        showLoading(true);
        
        const { data: record, error } = await db
            .from('maintenance_records')
            .select(`
                *,
                ict_assets(name, asset_tag, status),
                technician:profiles!maintenance_records_technician_id_fkey(full_name, email),
                fault_reports(id, description, status)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const body = document.getElementById('viewMaintenanceBody');
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Maintenance Information</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Record ID</th><td>#${record.id.substring(0, 8)}</td></tr>
                        <tr><th>Asset</th><td>${escapeHtml(record.ict_assets?.name || 'Unknown')} (${escapeHtml(record.ict_assets?.asset_tag || '')})</td></tr>
                        <tr><th>Type</th><td><span class="badge ${getStatusBadgeClass(record.maintenance_type)}">${formatStatus(record.maintenance_type)}</span></td></tr>
                        <tr><th>Status</th><td><span class="badge ${getStatusBadgeClass(record.status)}">${formatStatus(record.status)}</span></td></tr>
                        <tr><th>Cost</th><td>${formatCurrency(record.cost)}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Schedule & Assignment</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Technician</th><td>${escapeHtml(record.technician?.full_name || '-')}</td></tr>
                        <tr><th>Scheduled Date</th><td>${formatDate(record.scheduled_date)}</td></tr>
                        <tr><th>Completed Date</th><td>${formatDate(record.completed_date)}</td></tr>
                        <tr><th>Created</th><td>${formatDateTime(record.created_at)}</td></tr>
                    </table>
                </div>
            </div>
            ${record.fault_reports ? `
                <div class="alert alert-info mt-3">
                    <strong>Linked Fault Report:</strong> #${record.fault_reports.id.substring(0, 8)} - ${escapeHtml(truncateText(record.fault_reports.description, 100))}
                    <span class="badge ${getStatusBadgeClass(record.fault_reports.status)} ms-2">${formatStatus(record.fault_reports.status)}</span>
                </div>
            ` : ''}
            <hr>
            <h6 class="fw-bold mb-2">Description</h6>
            <p class="bg-light p-3 rounded">${escapeHtml(record.description)}</p>
            ${record.actions_taken ? `
                <h6 class="fw-bold mb-2">Actions Taken</h6>
                <p class="bg-light p-3 rounded">${escapeHtml(record.actions_taken)}</p>
            ` : ''}
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('viewMaintenanceModal'));
        modal.show();
        
    } catch (error) {
        console.error('View maintenance error:', error);
        showAlert('Error loading maintenance details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleMaintenanceSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('maintenanceId').value;
    const assetId = document.getElementById('maintenanceAsset').value;
    const status = document.getElementById('maintenanceStatus').value;
    const faultId = document.getElementById('maintenanceFault').value;
    
    const maintenanceData = {
        asset_id: assetId,
        fault_report_id: faultId || null,
        maintenance_type: document.getElementById('maintenanceType').value,
        status: status,
        scheduled_date: document.getElementById('maintenanceScheduledDate').value || null,
        completed_date: document.getElementById('maintenanceCompletedDate').value || null,
        cost: parseFloat(document.getElementById('maintenanceCost').value) || null,
        description: document.getElementById('maintenanceDescription').value.trim(),
        actions_taken: document.getElementById('maintenanceActions').value.trim() || null,
        technician_id: currentUser.id
    };
    
    try {
        showLoading(true);
        
        let error;
        if (id) {
            ({ error } = await db
                .from('maintenance_records')
                .update(maintenanceData)
                .eq('id', id));
        } else {
            ({ error } = await db
                .from('maintenance_records')
                .insert(maintenanceData));
        }
        
        if (error) throw error;
        
        // Update asset status based on maintenance status
        let assetStatus = 'under_maintenance';
        if (status === 'completed') {
            assetStatus = 'active';
        } else if (status === 'cancelled') {
            assetStatus = 'faulty';
        }
        
        await db
            .from('ict_assets')
            .update({ status: assetStatus })
            .eq('id', assetId);
        
        // Update linked fault report if completed
        if (faultId && status === 'completed') {
            await db
                .from('fault_reports')
                .update({ status: 'resolved' })
                .eq('id', faultId);
        }
        
        bootstrap.Modal.getInstance(document.getElementById('maintenanceModal')).hide();
        showAlert(id ? 'Maintenance record updated successfully' : 'Maintenance record created successfully', 'success');
        await loadMaintenance();
        
    } catch (error) {
        console.error('Save maintenance error:', error);
        showAlert(error.message || 'Error saving maintenance record', 'danger');
    } finally {
        showLoading(false);
    }
}
