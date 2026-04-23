// Sidebar Component - Injects sidebar into pages
// This allows for consistent navigation across all pages

function initSidebar(activePage) {
    const sidebarHTML = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-brand">
                    <div class="sidebar-logo"><i class="bi bi-hdd-network"></i></div>
                    <div>
                        <h1 class="sidebar-title">UZ ICT System</h1>
                        <p class="sidebar-subtitle">Resource Management</p>
                    </div>
                </div>
            </div>
            <nav>
                <div class="nav-section">
                    <div class="nav-section-label">Main</div>
                    <a href="dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
                        <i class="bi bi-grid-1x2"></i><span>Dashboard</span>
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-label">Assets</div>
                    <a href="assets.html" class="nav-item ${activePage === 'assets' ? 'active' : ''}">
                        <i class="bi bi-hdd-stack"></i><span>Asset Register</span>
                    </a>
                    <a href="software.html" class="nav-item admin-technician-only d-none ${activePage === 'software' ? 'active' : ''}">
                        <i class="bi bi-file-earmark-code"></i><span>Software Assets</span>
                    </a>
                    <a href="allocations.html" class="nav-item ${activePage === 'allocations' ? 'active' : ''}">
                        <i class="bi bi-arrow-left-right"></i><span>Allocation & Movement</span>
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-label">Operations</div>
                    <a href="faults.html" class="nav-item ${activePage === 'faults' ? 'active' : ''}">
                        <i class="bi bi-exclamation-triangle"></i><span>Fault Reporting</span>
                    </a>
                    <a href="maintenance.html" class="nav-item ${activePage === 'maintenance' ? 'active' : ''}">
                        <i class="bi bi-tools"></i><span>Maintenance</span>
                    </a>
                    <a href="service_requests.html" class="nav-item ${activePage === 'service_requests' ? 'active' : ''}">
                        <i class="bi bi-clipboard-plus"></i><span>Service Requests</span>
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-label">Admin</div>
                    <a href="reports.html" class="nav-item ${activePage === 'reports' ? 'active' : ''}">
                        <i class="bi bi-file-earmark-bar-graph"></i><span>Reports</span>
                    </a>
                    <a href="users.html" class="nav-item admin-only d-none ${activePage === 'users' ? 'active' : ''}">
                        <i class="bi bi-people"></i><span>User Management</span>
                    </a>
                </div>
            </nav>
            <div class="sidebar-footer">
                <a href="#" class="nav-item" onclick="logout(); return false;">
                    <i class="bi bi-box-arrow-left"></i><span>Sign out</span>
                </a>
            </div>
        </aside>
    `;
    
    // Find the app container and prepend sidebar
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
}

function initTopbar() {
    const topbarHTML = `
        <header class="topbar">
            <div class="topbar-title">University of Zimbabwe · ICT Resource Management System</div>
            <div class="topbar-user">
                <span class="topbar-user-name" id="userDisplayName">User</span>
                <div class="topbar-avatar" id="userAvatar">U</div>
            </div>
        </header>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
    }
}

function updateUserAvatar() {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl && typeof currentProfile !== 'undefined' && currentProfile) {
        const name = currentProfile.full_name || currentProfile.email || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
}

// Call updateUserAvatar when auth completes
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateUserAvatar, 600);
});
