// Software Assets Module

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            await initSoftwarePage();
        }
    }, 500);
});

async function initSoftwarePage() {
    await loadDepartmentsForDropdown();
    await loadSoftware();
    setupEventListeners();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadSoftware(), 300));
    }
    ['filterStatus', 'filterLicenseType', 'filterDepartment'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadSoftware());
    });
    const form = document.getElementById('softwareForm');
    if (form) form.addEventListener('submit', handleSoftwareSubmit);
}

async function loadDepartmentsForDropdown() {
    try {
        const { data, error } = await db.from('departments').select('id, name').order('name');
        if (error) throw error;
        const sel = document.getElementById('softwareDepartment');
        const filterSel = document.getElementById('filterDepartment');
        const opts = data.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        if (sel) sel.innerHTML = '<option value="">University-wide</option>' + opts;
        if (filterSel) filterSel.innerHTML = '<option value="">All Departments</option>' + opts;
    } catch (error) {
        console.error('Load departments error:', error);
    }
}

async function loadSoftware() {
    try {
        const tbody = document.getElementById('softwareTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

        let query = db
            .from('software_assets')
            .select('*, departments(name)')
            .order('name');

        const search = document.getElementById('searchInput')?.value?.trim();
        const status = document.getElementById('filterStatus')?.value;
        const licenseType = document.getElementById('filterLicenseType')?.value;
        const deptId = document.getElementById('filterDepartment')?.value;

        if (search) query = query.or(`name.ilike.%${search}%,vendor.ilike.%${search}%`);
        if (status) query = query.eq('status', status);
        if (licenseType) query = query.eq('license_type', licenseType);
        if (deptId) query = query.eq('department_id', deptId);

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No software assets found</td></tr>';
            return;
        }

        const today = new Date();
        const sixtyDays = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

        tbody.innerHTML = data.map(sw => {
            const expiryDate = sw.license_expiry ? new Date(sw.license_expiry) : null;
            const expiryWarning = expiryDate && expiryDate <= sixtyDays && expiryDate >= today && sw.status === 'active';
            const expiryDisplay = sw.license_expiry
                ? `${formatDate(sw.license_expiry)}${expiryWarning ? ' <span class="badge badge-warning ms-1" title="Expiring soon">⚠</span>' : ''}`
                : '-';

            return `
            <tr>
                <td>
                    <span class="fw-medium">${escapeHtml(sw.name)}</span>
                    ${sw.version ? `<br><small class="text-muted">v${escapeHtml(sw.version)}</small>` : ''}
                </td>
                <td>${escapeHtml(sw.vendor || '-')}</td>
                <td><span class="badge badge-license-${sw.license_type}">${formatStatus(sw.license_type)}</span></td>
                <td>${sw.total_seats != null ? sw.total_seats : '-'}</td>
                <td>${escapeHtml(sw.departments?.name || 'University-wide')}</td>
                <td><span class="badge ${getStatusBadgeClass(sw.status)}">${formatStatus(sw.status)}</span></td>
                <td>${expiryDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary btn-action" onclick="viewSoftware('${sw.id}')" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${isAdmin() || isTechnician() ? `
                        <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editSoftware('${sw.id}')" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action" onclick="deleteSoftware('${sw.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>`;
        }).join('');

    } catch (error) {
        console.error('Load software error:', error);
        document.getElementById('softwareTableBody').innerHTML =
            '<tr><td colspan="8" class="text-center text-danger py-4">Error loading software assets</td></tr>';
    }
}

function openAddSoftwareModal() {
    document.getElementById('softwareModalTitle').textContent = 'Add Software';
    document.getElementById('softwareForm').reset();
    document.getElementById('softwareId').value = '';
    const modal = new bootstrap.Modal(document.getElementById('softwareModal'));
    modal.show();
}

async function editSoftware(id) {
    try {
        showLoading(true);
        const { data: sw, error } = await db.from('software_assets').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('softwareModalTitle').textContent = 'Edit Software';
        document.getElementById('softwareId').value = sw.id;
        document.getElementById('softwareName').value = sw.name || '';
        document.getElementById('softwareVersion').value = sw.version || '';
        document.getElementById('softwareVendor').value = sw.vendor || '';
        document.getElementById('softwareLicenseType').value = sw.license_type || 'perpetual';
        document.getElementById('softwareLicenseKey').value = sw.license_key || '';
        document.getElementById('softwareSeats').value = sw.total_seats || '';
        document.getElementById('softwareDepartment').value = sw.department_id || '';
        document.getElementById('softwareStatus').value = sw.status || 'active';
        document.getElementById('softwarePurchaseDate').value = sw.purchase_date || '';
        document.getElementById('softwareLicenseExpiry').value = sw.license_expiry || '';
        document.getElementById('softwareCost').value = sw.cost || '';
        document.getElementById('softwareNotes').value = sw.notes || '';

        const modal = new bootstrap.Modal(document.getElementById('softwareModal'));
        modal.show();
    } catch (error) {
        console.error('Edit software error:', error);
        showAlert('Error loading software details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function viewSoftware(id) {
    try {
        showLoading(true);
        const { data: sw, error } = await db
            .from('software_assets')
            .select('*, departments(name)')
            .eq('id', id)
            .single();
        if (error) throw error;

        const today = new Date();
        const expiryDate = sw.license_expiry ? new Date(sw.license_expiry) : null;
        const daysToExpiry = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
        const expiryAlert = daysToExpiry !== null && daysToExpiry <= 60 && daysToExpiry >= 0 && sw.status === 'active'
            ? `<div class="alert alert-warning mt-2 mb-0 py-2"><i class="bi bi-exclamation-triangle me-2"></i>License expires in <strong>${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}</strong></div>`
            : '';

        document.getElementById('viewSoftwareBody').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Software Information</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Name</th><td>${escapeHtml(sw.name)}</td></tr>
                        <tr><th>Version</th><td>${escapeHtml(sw.version || '-')}</td></tr>
                        <tr><th>Vendor</th><td>${escapeHtml(sw.vendor || '-')}</td></tr>
                        <tr><th>License Type</th><td><span class="badge badge-license-${sw.license_type}">${formatStatus(sw.license_type)}</span></td></tr>
                        <tr><th>Status</th><td><span class="badge ${getStatusBadgeClass(sw.status)}">${formatStatus(sw.status)}</span></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">License Details</h6>
                    <table class="table table-sm">
                        <tr><th width="40%">Total Seats</th><td>${sw.total_seats != null ? sw.total_seats : '-'}</td></tr>
                        <tr><th>Department</th><td>${escapeHtml(sw.departments?.name || 'University-wide')}</td></tr>
                        <tr><th>Purchase Date</th><td>${formatDate(sw.purchase_date)}</td></tr>
                        <tr><th>License Expiry</th><td>${formatDate(sw.license_expiry)}</td></tr>
                        <tr><th>Cost</th><td>${formatCurrency(sw.cost)}</td></tr>
                    </table>
                </div>
                ${sw.license_key ? `
                <div class="col-12">
                    <h6 class="fw-bold mb-2">License Key</h6>
                    <code class="d-block p-3 bg-light rounded">${escapeHtml(sw.license_key)}</code>
                </div>` : ''}
                ${sw.notes ? `
                <div class="col-12">
                    <h6 class="fw-bold mb-2">Notes</h6>
                    <p class="bg-light p-3 rounded mb-0">${escapeHtml(sw.notes)}</p>
                </div>` : ''}
                ${expiryAlert ? `<div class="col-12">${expiryAlert}</div>` : ''}
            </div>`;

        const modal = new bootstrap.Modal(document.getElementById('viewSoftwareModal'));
        modal.show();
    } catch (error) {
        console.error('View software error:', error);
        showAlert('Error loading software details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function deleteSoftware(id) {
    if (!confirm('Delete this software record? This action cannot be undone.')) return;
    try {
        showLoading(true);
        const { error } = await db.from('software_assets').delete().eq('id', id);
        if (error) throw error;
        showAlert('Software record deleted', 'success');
        await loadSoftware();
    } catch (error) {
        console.error('Delete software error:', error);
        showAlert('Error deleting software record', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleSoftwareSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('softwareId').value;

    const swData = {
        name: document.getElementById('softwareName').value.trim(),
        version: document.getElementById('softwareVersion').value.trim() || null,
        vendor: document.getElementById('softwareVendor').value.trim() || null,
        license_type: document.getElementById('softwareLicenseType').value,
        license_key: document.getElementById('softwareLicenseKey').value.trim() || null,
        total_seats: parseInt(document.getElementById('softwareSeats').value) || null,
        department_id: document.getElementById('softwareDepartment').value || null,
        status: document.getElementById('softwareStatus').value,
        purchase_date: document.getElementById('softwarePurchaseDate').value || null,
        license_expiry: document.getElementById('softwareLicenseExpiry').value || null,
        cost: parseFloat(document.getElementById('softwareCost').value) || null,
        notes: document.getElementById('softwareNotes').value.trim() || null
    };

    try {
        showLoading(true);
        let error;
        if (id) {
            ({ error } = await db.from('software_assets').update(swData).eq('id', id));
        } else {
            ({ error } = await db.from('software_assets').insert(swData));
        }
        if (error) throw error;

        bootstrap.Modal.getInstance(document.getElementById('softwareModal')).hide();
        showAlert(id ? 'Software updated successfully' : 'Software added successfully', 'success');
        await loadSoftware();
    } catch (error) {
        console.error('Save software error:', error);
        showAlert(error.message || 'Error saving software', 'danger');
    } finally {
        showLoading(false);
    }
}
