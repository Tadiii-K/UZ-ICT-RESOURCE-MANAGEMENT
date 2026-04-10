// Allocations Module

let assets = [];
let departments = [];

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initAllocationsPage();
        }
    }, 500);
});

async function initAllocationsPage() {
    await Promise.all([
        loadAssetsForDropdown(),
        loadDepartments()
    ]);
    await loadAllocations();
    setupEventListeners();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadAllocations(), 300));
    }
    
    ['filterFromDept', 'filterToDept'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadAllocations());
        }
    });
    
    const allocationForm = document.getElementById('allocationForm');
    if (allocationForm) {
        allocationForm.addEventListener('submit', handleAllocationSubmit);
    }
    
    // Update current department text when asset changes
    const allocationAsset = document.getElementById('allocationAsset');
    if (allocationAsset) {
        allocationAsset.addEventListener('change', updateCurrentDepartmentText);
    }
}

async function loadAssetsForDropdown() {
    try {
        const { data, error } = await db
            .from('ict_assets')
            .select('id, name, asset_tag, department_id, departments(name)')
            .neq('status', 'disposed')
            .order('name');
        
        if (error) throw error;
        
        assets = data || [];
        
        const allocationAsset = document.getElementById('allocationAsset');
        if (allocationAsset) {
            allocationAsset.innerHTML = '<option value="">Select Asset</option>' + 
                assets.map(a => `<option value="${a.id}" data-dept-id="${a.department_id}" data-dept-name="${a.departments?.name || 'Unassigned'}">${escapeHtml(a.asset_tag)} - ${escapeHtml(a.name)}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Load assets error:', error);
    }
}

async function loadDepartments() {
    try {
        const { data, error } = await db
            .from('departments')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        departments = data || [];
        
        const options = departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        
        ['filterFromDept', 'filterToDept', 'allocationToDept'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id.startsWith('filter')) {
                    el.innerHTML = '<option value="">All Departments</option>' + options;
                } else {
                    el.innerHTML = '<option value="">Select Department</option>' + options;
                }
            }
        });
        
    } catch (error) {
        console.error('Load departments error:', error);
    }
}

function updateCurrentDepartmentText() {
    const select = document.getElementById('allocationAsset');
    const textEl = document.getElementById('currentDeptText');
    
    if (!select || !textEl) return;
    
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const deptName = selectedOption.dataset.deptName || 'Unassigned';
        textEl.textContent = `Current Department: ${deptName}`;
    } else {
        textEl.textContent = '';
    }
}

async function loadAllocations() {
    try {
        const tbody = document.getElementById('allocationsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';
        
        let query = db
            .from('allocations')
            .select(`
                *,
                ict_assets(name, asset_tag),
                from_department:departments!allocations_from_department_id_fkey(name),
                to_department:departments!allocations_to_department_id_fkey(name),
                allocated_by:profiles!allocations_allocated_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        const search = document.getElementById('searchInput')?.value?.trim();
        const fromDept = document.getElementById('filterFromDept')?.value;
        const toDept = document.getElementById('filterToDept')?.value;
        
        if (search) {
            query = query.or(`notes.ilike.%${search}%`);
        }
        if (fromDept) {
            query = query.eq('from_department_id', fromDept);
        }
        if (toDept) {
            query = query.eq('to_department_id', toDept);
        }
        
        const { data: allocations, error } = await query;
        
        if (error) throw error;
        
        if (!allocations || allocations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No allocations found</td></tr>';
            return;
        }
        
        tbody.innerHTML = allocations.map(allocation => `
            <tr>
                <td><span class="fw-medium">#${allocation.id.substring(0, 8)}</span></td>
                <td>
                    <span class="fw-medium">${escapeHtml(allocation.ict_assets?.name || 'Unknown')}</span>
                    <br><small class="text-muted">${escapeHtml(allocation.ict_assets?.asset_tag || '')}</small>
                </td>
                <td>${escapeHtml(allocation.from_department?.name || 'N/A')}</td>
                <td>
                    <i class="bi bi-arrow-right text-primary me-2"></i>
                    ${escapeHtml(allocation.to_department?.name || 'N/A')}
                </td>
                <td>${escapeHtml(allocation.allocated_by?.full_name || '-')}</td>
                <td><small>${formatDate(allocation.created_at)}</small></td>
                <td class="text-truncate" style="max-width: 150px;">${escapeHtml(allocation.notes || '-')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewAllocation('${allocation.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load allocations error:', error);
        document.getElementById('allocationsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center text-danger py-4">Error loading allocations</td></tr>';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterFromDept').value = '';
    document.getElementById('filterToDept').value = '';
    loadAllocations();
}

function openAddAllocationModal() {
    document.getElementById('allocationModalTitle').textContent = 'New Allocation';
    document.getElementById('allocationForm').reset();
    document.getElementById('allocationId').value = '';
    document.getElementById('currentDeptText').textContent = '';
    const modal = new bootstrap.Modal(document.getElementById('allocationModal'));
    modal.show();
}

async function viewAllocation(id) {
    try {
        showLoading(true);
        
        const { data: allocation, error } = await db
            .from('allocations')
            .select(`
                *,
                ict_assets(name, asset_tag, status),
                from_department:departments!allocations_from_department_id_fkey(name),
                to_department:departments!allocations_to_department_id_fkey(name),
                allocated_by:profiles!allocations_allocated_by_fkey(full_name, email)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const body = document.getElementById('viewAllocationBody');
        body.innerHTML = `
            <div class="text-center mb-4">
                <div class="d-flex justify-content-center align-items-center">
                    <div class="bg-light rounded p-3 text-center" style="min-width: 120px;">
                        <i class="bi bi-building text-muted fs-4"></i>
                        <div class="fw-bold mt-2">${escapeHtml(allocation.from_department?.name || 'N/A')}</div>
                        <small class="text-muted">From</small>
                    </div>
                    <div class="mx-4">
                        <i class="bi bi-arrow-right fs-2 text-primary"></i>
                    </div>
                    <div class="bg-primary bg-opacity-10 rounded p-3 text-center" style="min-width: 120px;">
                        <i class="bi bi-building text-primary fs-4"></i>
                        <div class="fw-bold mt-2">${escapeHtml(allocation.to_department?.name || 'N/A')}</div>
                        <small class="text-muted">To</small>
                    </div>
                </div>
            </div>
            
            <table class="table table-sm">
                <tr><th width="35%">Allocation ID</th><td>#${allocation.id.substring(0, 8)}</td></tr>
                <tr><th>Asset</th><td>${escapeHtml(allocation.ict_assets?.name || 'Unknown')} (${escapeHtml(allocation.ict_assets?.asset_tag || '')})</td></tr>
                <tr><th>Asset Status</th><td><span class="badge ${getStatusBadgeClass(allocation.ict_assets?.status)}">${formatStatus(allocation.ict_assets?.status)}</span></td></tr>
                <tr><th>Allocated By</th><td>${escapeHtml(allocation.allocated_by?.full_name || '-')}</td></tr>
                <tr><th>Date</th><td>${formatDateTime(allocation.created_at)}</td></tr>
            </table>
            
            ${allocation.notes ? `
                <h6 class="fw-bold mb-2">Notes</h6>
                <p class="bg-light p-3 rounded">${escapeHtml(allocation.notes)}</p>
            ` : ''}
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('viewAllocationModal'));
        modal.show();
        
    } catch (error) {
        console.error('View allocation error:', error);
        showAlert('Error loading allocation details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleAllocationSubmit(e) {
    e.preventDefault();
    
    const assetId = document.getElementById('allocationAsset').value;
    const toDeptId = document.getElementById('allocationToDept').value;
    
    // Get current department from selected asset
    const selectedOption = document.getElementById('allocationAsset').options[document.getElementById('allocationAsset').selectedIndex];
    const fromDeptId = selectedOption?.dataset.deptId || null;
    
    if (fromDeptId === toDeptId) {
        showAlert('Asset is already in the selected department', 'warning');
        return;
    }
    
    const allocationData = {
        asset_id: assetId,
        from_department_id: fromDeptId || null,
        to_department_id: toDeptId,
        allocated_by: currentUser.id,
        notes: document.getElementById('allocationNotes').value.trim() || null
    };
    
    try {
        showLoading(true);
        
        // Create allocation record
        const { error } = await db
            .from('allocations')
            .insert(allocationData);
        
        if (error) throw error;
        
        // Update asset's department
        const { error: updateError } = await db
            .from('ict_assets')
            .update({ department_id: toDeptId })
            .eq('id', assetId);
        
        if (updateError) throw updateError;
        
        bootstrap.Modal.getInstance(document.getElementById('allocationModal')).hide();
        showAlert('Asset transferred successfully', 'success');
        
        // Reload data
        await loadAssetsForDropdown();
        await loadAllocations();
        
    } catch (error) {
        console.error('Save allocation error:', error);
        showAlert(error.message || 'Error transferring asset', 'danger');
    } finally {
        showLoading(false);
    }
}
