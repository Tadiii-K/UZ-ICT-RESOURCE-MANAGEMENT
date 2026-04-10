// Users Module (Admin Only)

let departments = [];

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            // Check admin access
            if (!isAdmin()) {
                window.location.href = 'dashboard.html';
                return;
            }
            await initUsersPage();
        }
    }, 500);
});

async function initUsersPage() {
    await loadDepartments();
    await loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadUsers(), 300));
    }
    
    ['filterRole', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => loadUsers());
        }
    });
    
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
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
        
        const userDepartment = document.getElementById('userDepartment');
        if (userDepartment) {
            userDepartment.innerHTML = '<option value="">Select Department</option>' + 
                departments.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
        }
        
    } catch (error) {
        console.error('Load departments error:', error);
    }
}

async function loadUsers() {
    try {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';
        
        let query = db
            .from('profiles')
            .select(`
                *,
                departments(name)
            `)
            .order('created_at', { ascending: false });
        
        // Apply filters
        const search = document.getElementById('searchInput')?.value?.trim();
        const role = document.getElementById('filterRole')?.value;
        const status = document.getElementById('filterStatus')?.value;
        
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        if (role) {
            query = query.eq('role', role);
        }
        if (status !== '') {
            query = query.eq('is_active', status === 'true');
        }
        
        const { data: users, error } = await query;
        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <span class="fw-medium">${escapeHtml(user.full_name || '-')}</span>
                </td>
                <td>${escapeHtml(user.email || '-')}</td>
                <td><span class="badge badge-${user.role}">${formatStatus(user.role)}</span></td>
                <td>${escapeHtml(user.departments?.name || '-')}</td>
                <td>
                    ${user.is_active 
                        ? '<span class="badge badge-active">Active</span>' 
                        : '<span class="badge badge-inactive">Inactive</span>'}
                </td>
                <td><small>${formatDate(user.created_at)}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary btn-action" onclick="editUser('${user.id}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${user.id !== currentUser.id ? `
                        <button class="btn btn-sm btn-outline-${user.is_active ? 'danger' : 'success'} btn-action" 
                                onclick="toggleUserStatus('${user.id}', ${!user.is_active})" 
                                title="${user.is_active ? 'Deactivate' : 'Activate'}">
                            <i class="bi bi-${user.is_active ? 'person-dash' : 'person-check'}"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load users error:', error);
        document.getElementById('usersTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger py-4">Error loading users</td></tr>';
    }
}

function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userActive').checked = true;
    
    // Show password field for new users
    document.getElementById('passwordField').classList.remove('d-none');
    document.getElementById('userPassword').required = true;
    
    // Enable email field
    document.getElementById('userEmail').disabled = false;
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
}

async function editUser(id) {
    try {
        showLoading(true);
        
        const { data: user, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userFullName').value = user.full_name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRoleSelect').value = user.role || '';
        document.getElementById('userDepartment').value = user.department_id || '';
        document.getElementById('userActive').checked = user.is_active;
        
        // Hide password field for editing (can't change password this way)
        document.getElementById('passwordField').classList.add('d-none');
        document.getElementById('userPassword').required = false;
        
        // Disable email field (can't change email)
        document.getElementById('userEmail').disabled = true;
        
        const modal = new bootstrap.Modal(document.getElementById('userModal'));
        modal.show();
        
    } catch (error) {
        console.error('Edit user error:', error);
        showAlert('Error loading user details', 'danger');
    } finally {
        showLoading(false);
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('userId').value;
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const fullName = document.getElementById('userFullName').value.trim();
    const role = document.getElementById('userRoleSelect').value;
    const departmentId = document.getElementById('userDepartment').value || null;
    const isActive = document.getElementById('userActive').checked;
    
    try {
        showLoading(true);
        
        if (id) {
            // Update existing user profile
            const { error } = await db
                .from('profiles')
                .update({
                    full_name: fullName,
                    role: role,
                    department_id: departmentId,
                    is_active: isActive
                })
                .eq('id', id);
            
            if (error) throw error;
            
            showAlert('User updated successfully', 'success');
        } else {
            // Create new user via Supabase Auth
            const { data: authData, error: authError } = await db.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });
            
            if (authError) throw authError;
            
            if (authData.user) {
                // Create profile for the new user
                const { error: profileError } = await db
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: email,
                        full_name: fullName,
                        role: role,
                        department_id: departmentId,
                        is_active: isActive
                    });
                
                if (profileError) throw profileError;
            }
            
            showAlert('User created successfully. They will receive a confirmation email.', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadUsers();
        
    } catch (error) {
        console.error('Save user error:', error);
        showAlert(error.message || 'Error saving user', 'danger');
    } finally {
        showLoading(false);
    }
}

async function toggleUserStatus(id, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    try {
        showLoading(true);
        
        const { error } = await db
            .from('profiles')
            .update({ is_active: newStatus })
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert(`User ${action}d successfully`, 'success');
        await loadUsers();
        
    } catch (error) {
        console.error('Toggle user status error:', error);
        showAlert(error.message || `Error ${action}ing user`, 'danger');
    } finally {
        showLoading(false);
    }
}
