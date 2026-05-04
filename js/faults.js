// Faults Module

let assets = [];

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initFaultsPage();
        }
    }, 500);
});

async function initFaultsPage() {
    await loadAssetsForDropdown();
    await loadFaults();
    setupEventListeners();
    setupRoleBasedUI();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadFaults(), 300));
    }
    
    ['filterStatus', 'filterPriority'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadFaults());
        }
    });
    
    const faultForm = document.getElementById('faultForm');
    if (faultForm) {
        faultForm.addEventListener('submit', handleFaultSubmit);
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
        let query = db
            .from('ict_assets')
            .select('id, name, asset_tag, department_id')
            .order('name');
        
        // Department reps can only report faults for their department's assets
        if (isDepartmentRep() && currentProfile.department_id) {
            query = query.eq('department_id', currentProfile.department_id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        assets = data || [];
        
        const faultAsset = document.getElementById('faultAsset');
        if (faultAsset) {
            faultAsset.innerHTML = '<option value="">Select Asset</option>' + 
                assets.map(a => `<option value="${a.id}">${escapeHtml(a.asset_tag)} - ${escapeHtml(a.name)}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Load assets error:', error);
    }
}

async function loadFaults() {
    try {
        const tbody = document.getElementById('faultsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';
        
        let query = db
            .from('fault_reports')
            .select(`
                *,
                ict_assets(name, asset_tag, department_id),
                reporter:profiles!fault_reports_reported_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        const search = document.getElementById('searchInput')?.value?.trim();
        const status = document.getElementById('filterStatus')?.value;
        const priority = document.getElementById('filterPriority')?.value;
        
        if (search) {
            query = query.or(`description.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (priority) {
            query = query.eq('priority', priority);
        }
        
        // Department reps can only see faults for their department's assets
        if (isDepartmentRep() && currentProfile.department_id) {
            const deptAssetIds = assets.map(a => a.id);
            if (deptAssetIds.length > 0) {
                query = query.in('asset_id', deptAssetIds);
            }
        }
        
        const { data: faults, error } = await query;
        
        if (error) throw error;
        
        if (!faults || faults.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No fault reports found</td></tr>';
            return;
        }
        
        tbody.innerHTML = faults.map(fault => `
            <tr>
                <td><span class="fw-medium">#${fault.id.substring(0, 8)}</span></td>
                <td>
                    <span class="fw-medium">${escapeHtml(fault.ict_assets?.name || 'Unknown')}</span>
                    <br><small class="text-muted">${escapeHtml(fault.ict_assets?.asset_tag || '')}</small>
                </td>
                <td class="text-truncate" style="max-width: 200px;">${escapeHtml(fault.description)}</td>
                <td><span class="badge ${getStatusBadgeClass(fault.priority)}">${formatStatus(fault.priority)}</span></td>
                <td><span class="badge ${getStatusBadgeClass(fault.status)}">${formatStatus(fault.status)}</span></td>
                <td>${escapeHtml(fault.reporter?.full_name || '-')}</td>
                <td><small>${formatDate(fault.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewFault('${fault.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${isAdmin() || isTechnician() ? `
                        <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editFault('${fault.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load faults error:', error);
        document.getElementById('faultsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center text-danger py-4">Error loading fault reports</td></tr>';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    loadFaults();
}

function openAddFaultModal() {
    document.getElementById('faultModalTitle').textContent = 'Report Fault';
    document.getElementById('faultForm').reset();
    document.getElementById('faultId').value = '';
    document.getElementById('faultPriority').value = 'medium';
    
    // Hide status field for new reports (only technicians can change status)
    if (!isAdmin() && !isTechnician()) {
        document.getElementById('faultStatus')?.closest('.col-md-6')?.classList.add('d-none');
    }
    const modal = new bootstrap.Modal(document.getElementById('faultModal'));
    modal.show();
}

async function editFault(id) {
    try {
        showLoading(true);
        
        const { data: fault, error } = await db
            .from('fault_reports')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('faultModalTitle').textContent = 'Edit Fault Report';
        document.getElementById('faultId').value = fault.id;
        document.getElementById('faultAsset').value = fault.asset_id || '';
        document.getElementById('faultPriority').value = fault.priority || 'medium';
        document.getElementById('faultStatus').value = fault.status || 'reported';
        document.getElementById('faultDescription').value = fault.description || '';
        document.getElementById('faultResolutionNotes').value = fault.resolution_notes || '';
        
        // Show status field for editing
        document.getElementById('faultStatus')?.closest('.col-md-6')?.classList.remove('d-none');
        
        const modal = new bootstrap.Modal(document.getElementById('faultModal'));
        modal.show();
        
    } catch (error) {
        console.error('Edit fault error:', error);
        showAlert('Error loading fault details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function viewFault(id) {
    try {
        showLoading(true);
        
        const { data: fault, error } = await db
            .from('fault_reports')
            .select(`
                *,
                ict_assets(name, asset_tag, status),
                reporter:profiles!fault_reports_reported_by_fkey(full_name, email)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const body = document.getElementById('viewFaultBody');
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Fault Information</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Fault ID</th><td>#${fault.id.substring(0, 8)}</td></tr>
                        <tr><th>Asset</th><td>${escapeHtml(fault.ict_assets?.name || 'Unknown')} (${escapeHtml(fault.ict_assets?.asset_tag || '')})</td></tr>
                        <tr><th>Priority</th><td><span class="badge ${getStatusBadgeClass(fault.priority)}">${formatStatus(fault.priority)}</span></td></tr>
                        <tr><th>Status</th><td><span class="badge ${getStatusBadgeClass(fault.status)}">${formatStatus(fault.status)}</span></td></tr>
                        <tr><th>Asset Status</th><td><span class="badge ${getStatusBadgeClass(fault.ict_assets?.status)}">${formatStatus(fault.ict_assets?.status)}</span></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Reporter Details</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Reported By</th><td>${escapeHtml(fault.reporter?.full_name || '-')}</td></tr>
                        <tr><th>Email</th><td>${escapeHtml(fault.reporter?.email || '-')}</td></tr>
                        <tr><th>Reported On</th><td>${formatDateTime(fault.created_at)}</td></tr>
                        <tr><th>Last Updated</th><td>${formatDateTime(fault.updated_at)}</td></tr>
                    </table>
                </div>
            </div>
            <hr>
            <h6 class="fw-bold mb-2">Issue Description</h6>
            <p class="bg-light p-3 rounded">${escapeHtml(fault.description)}</p>
            ${fault.resolution_notes ? `
                <h6 class="fw-bold mb-2">Resolution Notes</h6>
                <p class="bg-light p-3 rounded">${escapeHtml(fault.resolution_notes)}</p>
            ` : ''}
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('viewFaultModal'));
        modal.show();
        
    } catch (error) {
        console.error('View fault error:', error);
        showAlert('Error loading fault details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleFaultSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('faultId').value;
    const assetId = document.getElementById('faultAsset').value;
    const status = document.getElementById('faultStatus')?.value || 'reported';
    
    const faultData = {
        asset_id: assetId,
        priority: document.getElementById('faultPriority').value,
        status: status,
        description: document.getElementById('faultDescription').value.trim(),
        resolution_notes: document.getElementById('faultResolutionNotes')?.value.trim() || null
    };
    
    // Only set reported_by for new reports
    if (!id) {
        faultData.reported_by = currentUser.id;
    }
    
    try {
        showLoading(true);
        
        let error;
        if (id) {
            ({ error } = await db
                .from('fault_reports')
                .update(faultData)
                .eq('id', id));
        } else {
            ({ error } = await db
                .from('fault_reports')
                .insert(faultData));
            
            // Update asset status to faulty
            if (!error) {
                await db
                    .from('ict_assets')
                    .update({ status: 'faulty' })
                    .eq('id', assetId);
            }
        }
        
        if (error) throw error;
        
        // If fault is resolved/closed, update asset status
        if (id && (status === 'resolved' || status === 'closed')) {
            await db
                .from('ict_assets')
                .update({ status: 'active' })
                .eq('id', assetId);
        }
        
        bootstrap.Modal.getInstance(document.getElementById('faultModal')).hide();
        showAlert(id ? 'Fault report updated successfully' : 'Fault reported successfully', 'success');
        await loadFaults();
        
    } catch (error) {
        console.error('Save fault error:', error);
        showAlert(error.message || 'Error saving fault report', 'danger');
    } finally {
        showLoading(false);
    }
}
