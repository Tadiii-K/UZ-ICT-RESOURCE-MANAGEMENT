// Assets Module

let categories = [];
let departments = [];

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initAssetsPage();
        }
    }, 500);
});

async function initAssetsPage() {
    await Promise.all([
        loadCategories(),
        loadDepartments()
    ]);
    await loadAssets();
    setupEventListeners();
}

function setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadAssets(), 300));
    }
    
    // Filter changes
    ['filterCategory', 'filterDepartment', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadAssets());
        }
    });
    
    // Asset form submission
    const assetForm = document.getElementById('assetForm');
    if (assetForm) {
        assetForm.addEventListener('submit', handleAssetSubmit);
    }
}

async function loadCategories() {
    try {
        const { data, error } = await db
            .from('categories')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        categories = data || [];
        
        // Populate filter dropdown
        const filterCategory = document.getElementById('filterCategory');
        const assetCategory = document.getElementById('assetCategory');
        
        const options = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        
        if (filterCategory) {
            filterCategory.innerHTML = '<option value="">All Categories</option>' + options;
        }
        if (assetCategory) {
            assetCategory.innerHTML = '<option value="">Select Category</option>' + options;
        }
        
    } catch (error) {
        console.error('Load categories error:', error);
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
        
        // Populate filter dropdown
        const filterDepartment = document.getElementById('filterDepartment');
        const assetDepartment = document.getElementById('assetDepartment');
        
        const options = departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        
        if (filterDepartment) {
            filterDepartment.innerHTML = '<option value="">All Departments</option>' + options;
        }
        if (assetDepartment) {
            assetDepartment.innerHTML = '<option value="">Select Department</option>' + options;
        }
        
    } catch (error) {
        console.error('Load departments error:', error);
    }
}

async function loadAssets() {
    try {
        const tbody = document.getElementById('assetsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';
        
        let query = db
            .from('ict_assets')
            .select(`
                *,
                categories(name),
                departments(name)
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        const search = document.getElementById('searchInput')?.value?.trim();
        const categoryId = document.getElementById('filterCategory')?.value;
        const departmentId = document.getElementById('filterDepartment')?.value;
        const status = document.getElementById('filterStatus')?.value;
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%,serial_number.ilike.%${search}%`);
        }
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        if (departmentId) {
            query = query.eq('department_id', departmentId);
        }
        if (status) {
            query = query.eq('status', status);
        }
        
        // Department reps can only see their department's assets
        if (isDepartmentRep() && currentProfile.department_id) {
            query = query.eq('department_id', currentProfile.department_id);
        }
        
        const { data: assets, error } = await query;
        
        if (error) throw error;
        
        if (!assets || assets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No assets found</td></tr>';
            return;
        }
        
        tbody.innerHTML = assets.map(asset => `
            <tr>
                <td><span class="fw-medium">${escapeHtml(asset.asset_tag)}</span></td>
                <td>${escapeHtml(asset.name)}</td>
                <td>${escapeHtml(asset.categories?.name || '-')}</td>
                <td>${escapeHtml(asset.departments?.name || '-')}</td>
                <td>${escapeHtml(asset.location || '-')}</td>
                <td><span class="badge ${getStatusBadgeClass(asset.status)}">${formatStatus(asset.status)}</span></td>
                <td>${escapeHtml(asset.assigned_user || '-')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewAsset('${asset.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${isAdmin() ? `
                        <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editAsset('${asset.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteAsset('${asset.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load assets error:', error);
        document.getElementById('assetsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center text-danger py-4">Error loading assets</td></tr>';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterStatus').value = '';
    loadAssets();
}

function openAddAssetModal() {
    document.getElementById('assetModalTitle').textContent = 'Add Asset';
    document.getElementById('assetForm').reset();
    document.getElementById('assetId').value = '';
    document.getElementById('assetStatus').value = 'active';
    const modal = new bootstrap.Modal(document.getElementById('assetModal'));
    modal.show();
}

async function editAsset(id) {
    try {
        showLoading(true);
        
        const { data: asset, error } = await db
            .from('ict_assets')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('assetModalTitle').textContent = 'Edit Asset';
        document.getElementById('assetId').value = asset.id;
        document.getElementById('assetTag').value = asset.asset_tag || '';
        document.getElementById('assetName').value = asset.name || '';
        document.getElementById('assetCategory').value = asset.category_id || '';
        document.getElementById('assetDepartment').value = asset.department_id || '';
        document.getElementById('assetSerial').value = asset.serial_number || '';
        document.getElementById('assetStatus').value = asset.status || 'active';
        document.getElementById('assetPurchaseDate').value = asset.purchase_date || '';
        document.getElementById('assetWarrantyExpiry').value = asset.warranty_expiry || '';
        document.getElementById('assetAssignedUser').value = asset.assigned_user || '';
        document.getElementById('assetLocation').value = asset.location || '';
        document.getElementById('assetDescription').value = asset.description || '';
        
        const modal = new bootstrap.Modal(document.getElementById('assetModal'));
        modal.show();
        
    } catch (error) {
        console.error('Edit asset error:', error);
        showAlert('Error loading asset details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function viewAsset(id) {
    try {
        showLoading(true);
        
        const { data: asset, error } = await db
            .from('ict_assets')
            .select(`
                *,
                categories(name),
                departments(name)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Load maintenance history
        const { data: maintenance } = await db
            .from('maintenance_records')
            .select('*')
            .eq('asset_id', id)
            .order('created_at', { ascending: false })
            .limit(5);
        
        // Load allocation history
        const { data: allocations } = await db
            .from('allocations')
            .select(`
                *,
                from_department:departments!allocations_from_department_id_fkey(name),
                to_department:departments!allocations_to_department_id_fkey(name)
            `)
            .eq('asset_id', id)
            .order('created_at', { ascending: false })
            .limit(5);
        
        const body = document.getElementById('viewAssetBody');
        body.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Basic Information</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Asset Tag</th><td>${escapeHtml(asset.asset_tag)}</td></tr>
                        <tr><th>Name</th><td>${escapeHtml(asset.name)}</td></tr>
                        <tr><th>Category</th><td>${escapeHtml(asset.categories?.name || '-')}</td></tr>
                        <tr><th>Department</th><td>${escapeHtml(asset.departments?.name || '-')}</td></tr>
                        <tr><th>Status</th><td><span class="badge ${getStatusBadgeClass(asset.status)}">${formatStatus(asset.status)}</span></td></tr>
                        <tr><th>Serial Number</th><td>${escapeHtml(asset.serial_number || '-')}</td></tr>
                        <tr><th>Assigned User</th><td>${escapeHtml(asset.assigned_user || '-')}</td></tr>
                        <tr><th>Location</th><td>${escapeHtml(asset.location || '-')}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Additional Details</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Purchase Date</th><td>${formatDate(asset.purchase_date)}</td></tr>
                        <tr><th>Warranty Expiry</th><td>${formatDate(asset.warranty_expiry)}</td></tr>
                        <tr><th>Created</th><td>${formatDateTime(asset.created_at)}</td></tr>
                        <tr><th>Last Updated</th><td>${formatDateTime(asset.updated_at)}</td></tr>
                    </table>
                    <h6 class="fw-bold mb-2 mt-3">Description</h6>
                    <p class="text-muted small">${escapeHtml(asset.description || 'No description')}</p>
                </div>
            </div>
            
            <hr>
            
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Recent Maintenance</h6>
                    ${maintenance && maintenance.length > 0 ? `
                        <ul class="list-group list-group-flush">
                            ${maintenance.map(m => `
                                <li class="list-group-item px-0">
                                    <div class="d-flex justify-content-between">
                                        <span class="badge ${getStatusBadgeClass(m.status)}">${formatStatus(m.status)}</span>
                                        <small class="text-muted">${formatDate(m.created_at)}</small>
                                    </div>
                                    <small>${escapeHtml(truncateText(m.description, 100))}</small>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p class="text-muted small">No maintenance records</p>'}
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Allocation History</h6>
                    ${allocations && allocations.length > 0 ? `
                        <ul class="list-group list-group-flush">
                            ${allocations.map(a => `
                                <li class="list-group-item px-0">
                                    <div class="d-flex justify-content-between">
                                        <span>${escapeHtml(a.from_department?.name || 'N/A')} → ${escapeHtml(a.to_department?.name || 'N/A')}</span>
                                        <small class="text-muted">${formatDate(a.created_at)}</small>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p class="text-muted small">No allocation history</p>'}
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('viewAssetModal'));
        modal.show();
        
    } catch (error) {
        console.error('View asset error:', error);
        showAlert('Error loading asset details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleAssetSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('assetId').value;
    const assetData = {
        asset_tag: document.getElementById('assetTag').value.trim(),
        name: document.getElementById('assetName').value.trim(),
        category_id: document.getElementById('assetCategory').value || null,
        department_id: document.getElementById('assetDepartment').value || null,
        serial_number: document.getElementById('assetSerial').value.trim() || null,
        status: document.getElementById('assetStatus').value,
        purchase_date: document.getElementById('assetPurchaseDate').value || null,
        warranty_expiry: document.getElementById('assetWarrantyExpiry').value || null,
        assigned_user: document.getElementById('assetAssignedUser').value.trim() || null,
        location: document.getElementById('assetLocation').value.trim() || null,
        description: document.getElementById('assetDescription').value.trim() || null
    };
    
    try {
        showLoading(true);
        
        let error;
        if (id) {
            // Update
            ({ error } = await db
                .from('ict_assets')
                .update(assetData)
                .eq('id', id));
        } else {
            // Insert
            ({ error } = await db
                .from('ict_assets')
                .insert(assetData));
        }
        
        if (error) throw error;
        
        bootstrap.Modal.getInstance(document.getElementById('assetModal')).hide();
        showAlert(id ? 'Asset updated successfully' : 'Asset created successfully', 'success');
        await loadAssets();
        
    } catch (error) {
        console.error('Save asset error:', error);
        showAlert(error.message || 'Error saving asset', 'danger');
    } finally {
        showLoading(false);
    }
}

async function deleteAsset(id) {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const { error } = await db
            .from('ict_assets')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Asset deleted successfully', 'success');
        await loadAssets();
        
    } catch (error) {
        console.error('Delete asset error:', error);
        showAlert(error.message || 'Error deleting asset', 'danger');
    } finally {
        showLoading(false);
    }
}
