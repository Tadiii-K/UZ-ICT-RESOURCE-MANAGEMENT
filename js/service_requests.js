// Service Requests Module

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initRequestsPage();
        }
    }, 500);
});

async function initRequestsPage() {
    await loadDepartmentsForDropdown();
    await loadRequests();
    setupEventListeners();
    setupRoleBasedUI();
}

function setupRoleBasedUI() {
    if (isAdmin() || isTechnician()) {
        document.querySelectorAll('.admin-technician-only').forEach(el => el.classList.remove('d-none'));
    }
    // Pre-fill department for department reps
    if (isDepartmentRep() && currentProfile.department_id) {
        const deptSel = document.getElementById('requestDepartment');
        if (deptSel) deptSel.value = currentProfile.department_id;
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadRequests(), 300));
    }
    ['filterStatus', 'filterType', 'filterPriority'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadRequests());
    });
    const form = document.getElementById('requestForm');
    if (form) form.addEventListener('submit', handleRequestSubmit);
}

async function loadDepartmentsForDropdown() {
    try {
        const { data, error } = await db.from('departments').select('id, name').order('name');
        if (error) throw error;
        const sel = document.getElementById('requestDepartment');
        if (sel) {
            sel.innerHTML = '<option value="">Select Department</option>' +
                data.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        }
    } catch (error) {
        console.error('Load departments error:', error);
    }
}

async function loadRequests() {
    try {
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

        let query = db
            .from('service_requests')
            .select(`
                *,
                departments(name),
                requester:profiles!service_requests_requested_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false });

        const search = document.getElementById('searchInput')?.value?.trim();
        const status = document.getElementById('filterStatus')?.value;
        const type = document.getElementById('filterType')?.value;
        const priority = document.getElementById('filterPriority')?.value;

        if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        if (status) query = query.eq('status', status);
        if (type) query = query.eq('request_type', type);
        if (priority) query = query.eq('priority', priority);

        // Department reps see only their own department's requests
        if (isDepartmentRep() && currentProfile.department_id) {
            query = query.eq('department_id', currentProfile.department_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No service requests found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(req => `
            <tr>
                <td><span class="fw-medium">#${req.id.substring(0, 8)}</span></td>
                <td>
                    <span class="fw-medium">${escapeHtml(req.title)}</span>
                </td>
                <td><span class="badge badge-type-${req.request_type}">${formatStatus(req.request_type)}</span></td>
                <td><span class="badge ${getStatusBadgeClass(req.priority)}">${formatStatus(req.priority)}</span></td>
                <td><span class="badge badge-${req.status}">${formatStatus(req.status)}</span></td>
                <td>${escapeHtml(req.departments?.name || '-')}</td>
                <td>${escapeHtml(req.requester?.full_name || '-')}</td>
                <td><small>${formatDate(req.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewRequest('${req.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${isAdmin() || isTechnician() ? `
                        <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editRequest('${req.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Load requests error:', error);
        document.getElementById('requestsTableBody').innerHTML =
            '<tr><td colspan="9" class="text-center text-danger py-4">Error loading service requests</td></tr>';
    }
}

function openAddRequestModal() {
    document.getElementById('requestModalTitle').textContent = 'New Service Request';
    document.getElementById('requestForm').reset();
    document.getElementById('requestId').value = '';
    document.getElementById('requestPriority').value = 'medium';

    // Pre-fill department for dept reps
    if (isDepartmentRep() && currentProfile.department_id) {
        document.getElementById('requestDepartment').value = currentProfile.department_id;
    }

    // Hide status field for new requests from non-admin/tech
    if (!isAdmin() && !isTechnician()) {
        document.getElementById('statusField')?.classList.add('d-none');
        document.getElementById('adminNotesField')?.classList.add('d-none');
    } else {
        document.getElementById('requestStatus').value = 'pending';
    }

    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    modal.show();
}

async function editRequest(id) {
    try {
        showLoading(true);
        const { data: req, error } = await db
            .from('service_requests')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;

        document.getElementById('requestModalTitle').textContent = 'Edit Service Request';
        document.getElementById('requestId').value = req.id;
        document.getElementById('requestTitle').value = req.title || '';
        document.getElementById('requestType').value = req.request_type || 'other';
        document.getElementById('requestPriority').value = req.priority || 'medium';
        document.getElementById('requestDepartment').value = req.department_id || '';
        document.getElementById('requestStatus').value = req.status || 'pending';
        document.getElementById('requestDescription').value = req.description || '';
        document.getElementById('requestAdminNotes').value = req.admin_notes || '';

        // Show status and admin notes fields for admins/techs
        document.getElementById('statusField')?.classList.remove('d-none');
        document.getElementById('adminNotesField')?.classList.remove('d-none');

        const modal = new bootstrap.Modal(document.getElementById('requestModal'));
        modal.show();
    } catch (error) {
        console.error('Edit request error:', error);
        showAlert('Error loading request details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function viewRequest(id) {
    try {
        showLoading(true);
        const { data: req, error } = await db
            .from('service_requests')
            .select(`
                *,
                departments(name),
                requester:profiles!service_requests_requested_by_fkey(full_name, email),
                assignee:profiles!service_requests_assigned_to_fkey(full_name)
            `)
            .eq('id', id)
            .single();
        if (error) throw error;

        document.getElementById('viewRequestBody').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Request Information</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">ID</th><td>#${req.id.substring(0, 8)}</td></tr>
                        <tr><th>Title</th><td>${escapeHtml(req.title)}</td></tr>
                        <tr><th>Type</th><td><span class="badge badge-type-${req.request_type}">${formatStatus(req.request_type)}</span></td></tr>
                        <tr><th>Priority</th><td><span class="badge ${getStatusBadgeClass(req.priority)}">${formatStatus(req.priority)}</span></td></tr>
                        <tr><th>Status</th><td><span class="badge badge-${req.status}">${formatStatus(req.status)}</span></td></tr>
                        <tr><th>Department</th><td>${escapeHtml(req.departments?.name || '-')}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Requester Details</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Requested By</th><td>${escapeHtml(req.requester?.full_name || '-')}</td></tr>
                        <tr><th>Email</th><td>${escapeHtml(req.requester?.email || '-')}</td></tr>
                        <tr><th>Submitted On</th><td>${formatDateTime(req.created_at)}</td></tr>
                        <tr><th>Last Updated</th><td>${formatDateTime(req.updated_at)}</td></tr>
                        ${req.assignee ? `<tr><th>Assigned To</th><td>${escapeHtml(req.assignee.full_name)}</td></tr>` : ''}
                    </table>
                </div>
                <div class="col-12">
                    <h6 class="fw-bold mb-2">Description</h6>
                    <p class="bg-light p-3 rounded mb-0">${escapeHtml(req.description)}</p>
                </div>
                ${(isAdmin() || isTechnician()) && req.admin_notes ? `
                <div class="col-12">
                    <h6 class="fw-bold mb-2">Admin Notes</h6>
                    <p class="bg-light p-3 rounded mb-0">${escapeHtml(req.admin_notes)}</p>
                </div>` : ''}
            </div>`;

        const modal = new bootstrap.Modal(document.getElementById('viewRequestModal'));
        modal.show();
    } catch (error) {
        console.error('View request error:', error);
        showAlert('Error loading request details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('requestId').value;

    const reqData = {
        title: document.getElementById('requestTitle').value.trim(),
        request_type: document.getElementById('requestType').value,
        priority: document.getElementById('requestPriority').value,
        department_id: document.getElementById('requestDepartment').value || null,
        description: document.getElementById('requestDescription').value.trim(),
        status: (isAdmin() || isTechnician()) ? document.getElementById('requestStatus').value : 'pending',
        admin_notes: (isAdmin() || isTechnician()) ? (document.getElementById('requestAdminNotes')?.value.trim() || null) : undefined
    };

    // Remove undefined keys
    Object.keys(reqData).forEach(k => reqData[k] === undefined && delete reqData[k]);

    if (!id) {
        reqData.requested_by = currentUser.id;
    }

    try {
        showLoading(true);
        let error;
        if (id) {
            ({ error } = await db.from('service_requests').update(reqData).eq('id', id));
        } else {
            ({ error } = await db.from('service_requests').insert(reqData));
        }
        if (error) throw error;

        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
        showAlert(id ? 'Request updated successfully' : 'Request submitted successfully', 'success');
        await loadRequests();
    } catch (error) {
        console.error('Save request error:', error);
        showAlert(error.message || 'Error saving request', 'danger');
    } finally {
        showLoading(false);
    }
}
