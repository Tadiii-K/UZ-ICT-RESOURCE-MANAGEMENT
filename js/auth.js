// Authentication Module

let currentUser = null;
let currentProfile = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

async function checkAuth() {
    try {
        const { data: { session }, error } = await db.auth.getSession();
        
        if (error) throw error;
        
        const isLoginPage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname === '/' ||
                           window.location.pathname.endsWith('/');
        
        if (!session) {
            if (!isLoginPage) {
                window.location.href = 'index.html';
            }
            return;
        }
        
        currentUser = session.user;
        
        // Get user profile
        const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('*, departments(name)')
            .eq('id', currentUser.id)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            if (!isLoginPage) {
                await logout();
            }
            return;
        }
        
        currentProfile = profile;
        
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Update UI with user info
        updateUserUI();
        
        // Check role-based access
        checkRoleAccess();
        
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

function updateUserUI() {
    const displayNameEl = document.getElementById('userDisplayName');
    const roleEl = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');
    
    if (displayNameEl && currentProfile) {
        displayNameEl.textContent = currentProfile.full_name || currentUser.email;
    }
    
    if (roleEl && currentProfile) {
        roleEl.textContent = formatStatus(currentProfile.role);
    }
    
    if (avatarEl && currentProfile) {
        const name = currentProfile.full_name || currentProfile.email || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
}

function checkRoleAccess() {
    if (!currentProfile) return;

    const role = currentProfile.role;

    // -----------------------------------------------------------------
    // 1. PAGE-LEVEL GUARD
    // Redirect users who try to open a page their role does not allow.
    // -----------------------------------------------------------------
    const currentPage = (window.location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
    const allowedRoles = PAGE_ACCESS[currentPage];
    if (allowedRoles && !allowedRoles.includes(role)) {
        showAlert('You do not have permission to access that page.', 'warning');
        window.location.href = 'dashboard.html';
        return;
    }

    // -----------------------------------------------------------------
    // 2. ELEMENT-LEVEL VISIBILITY (role-specific buttons / links)
    // Elements carry one of these classes and are hidden by default
    // with `d-none`; we reveal only what the current role may use.
    // -----------------------------------------------------------------
    if (role === ROLES.ADMIN) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('d-none'));
    }

    if (role === ROLES.ADMIN || role === ROLES.TECHNICIAN) {
        document.querySelectorAll('.technician-only').forEach(el => el.classList.remove('d-none'));
        document.querySelectorAll('.admin-technician-only').forEach(el => el.classList.remove('d-none'));
    }

    if (role === ROLES.DEPARTMENT_REP) {
        document.querySelectorAll('.department-rep-only').forEach(el => el.classList.remove('d-none'));
    }

    // Everyone logged in sees this
    document.querySelectorAll('.authenticated-only').forEach(el => el.classList.remove('d-none'));

    // Reveal the page body (kept hidden until role is verified to avoid
    // a flash of restricted content).
    document.body.classList.remove('pre-auth');
}

// -----------------------------------------------------------------
// Page-guard helper for JS modules to call at the top of their init.
// Usage: requireRole(ROLES.ADMIN, ROLES.TECHNICIAN)
// -----------------------------------------------------------------
function requireRole(...allowedRoles) {
    if (!currentProfile) return false;
    if (!allowedRoles.includes(currentProfile.role)) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// -----------------------------------------------------------------
// Data-scope helper: returns a Supabase query filter object
// that dept reps should apply to restrict data to their department.
// Returns null for admins/technicians (no scoping).
// -----------------------------------------------------------------
function getDepartmentScope() {
    if (currentProfile?.role === ROLES.DEPARTMENT_REP) {
        return currentProfile.department_id || null;
    }
    return null;
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const spinner = document.getElementById('loginSpinner');
        
        loginBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Check if user profile exists and is active
            const { data: profile, error: profileError } = await db
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            if (profileError || !profile) {
                throw new Error('User profile not found. Please contact administrator.');
            }
            
            if (!profile.is_active) {
                await db.auth.signOut();
                throw new Error('Your account has been deactivated. Please contact administrator.');
            }
            
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            showAlert(error.message, 'danger');
        } finally {
            loginBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    });
}

async function logout() {
    try {
        showLoading(true);
        await db.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Error logging out', 'danger');
    } finally {
        showLoading(false);
    }
}

// Listen for auth state changes
db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        const isLoginPage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname === '/';
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    }
});

// Helper function to get current user's department
function getCurrentUserDepartment() {
    return currentProfile?.department_id || null;
}

// Helper function to check if user has specific role
function hasRole(role) {
    return currentProfile?.role === role;
}

// Helper function to check if user is admin
function isAdmin() {
    return hasRole(ROLES.ADMIN);
}

// Helper function to check if user is technician
function isTechnician() {
    return hasRole(ROLES.TECHNICIAN);
}

// Helper function to check if user is department rep
function isDepartmentRep() {
    return hasRole(ROLES.DEPARTMENT_REP);
}
