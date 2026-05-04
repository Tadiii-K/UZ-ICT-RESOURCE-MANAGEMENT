// Dashboard Module

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth to complete
    setTimeout(async () => {
        if (currentProfile) {
            await loadDashboardData();
            updateUserAvatar();
        }
    }, 500);
});

function updateUserAvatar() {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl && currentProfile) {
        const name = currentProfile.full_name || currentProfile.email || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }
}

async function loadDashboardData() {
    try {
        showLoading(true);

        // Personalise the dashboard subtitle per role
        applyRoleBasedDashboardChrome();

        await Promise.all([
            loadAssetStats(),
            loadCategoryStats(),
            loadRecentFaults(),
            loadSystemAlerts()
        ]);

    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Error loading dashboard data', 'danger');
    } finally {
        showLoading(false);
    }
}

// Adjust the dashboard heading/subtitle and hide irrelevant cards based on role
function applyRoleBasedDashboardChrome() {
    const subtitleEl = document.querySelector('.page-subtitle');
    const titleEl = document.querySelector('.page-title');
    const role = currentProfile?.role;
    const deptName = currentProfile?.departments?.name;

    if (role === ROLES.ADMIN) {
        if (titleEl) titleEl.textContent = 'Admin Dashboard';
        if (subtitleEl) subtitleEl.textContent = 'University-wide ICT resource overview';
    } else if (role === ROLES.TECHNICIAN) {
        if (titleEl) titleEl.textContent = 'Technician Dashboard';
        if (subtitleEl) subtitleEl.textContent = 'Operational view — all departments';
    } else if (role === ROLES.DEPARTMENT_REP) {
        if (titleEl) titleEl.textContent = 'Department Dashboard';
        if (subtitleEl) subtitleEl.textContent = `${deptName || 'Your department'} — ICT resources`;
        // Dept reps should not see the "Disposed" stat (it's an admin concern)
        document.querySelectorAll('[data-admin-metric]').forEach(el => el.style.display = 'none');
    }
}

// Returns a Supabase query with `.eq('department_id', ...)` applied for dept reps
function applyDeptScope(query) {
    if (currentProfile?.role === ROLES.DEPARTMENT_REP && currentProfile.department_id) {
        return query.eq('department_id', currentProfile.department_id);
    }
    return query;
}

async function loadAssetStats() {
    try {
        // Total assets (scoped by department for dept reps)
        const { count: totalCount } = await applyDeptScope(db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true }));

        const { count: activeCount } = await applyDeptScope(db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'));

        const { count: faultyCount } = await applyDeptScope(db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'faulty'));

        const { count: maintenanceCount } = await applyDeptScope(db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'under_maintenance'));

        const { count: disposedCount } = await applyDeptScope(db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'disposed'));
        
        const total = totalCount || 0;
        const active = activeCount || 0;
        const faulty = faultyCount || 0;
        const maintenance = maintenanceCount || 0;
        const disposed = disposedCount || 0;
        
        // Update metric cards
        document.getElementById('totalAssets').textContent = total;
        document.getElementById('activeAssets').textContent = active;
        document.getElementById('faultyAssets').textContent = faulty;
        document.getElementById('underMaintenance').textContent = maintenance;
        document.getElementById('disposedAssets').textContent = disposed;
        
        // Update status summary cards
        document.getElementById('workingCount').textContent = active;
        document.getElementById('faultyCount').textContent = faulty;
        document.getElementById('maintenanceCount').textContent = maintenance;
        document.getElementById('disposedCountSummary').textContent = disposed;
        
        // Update percentages
        if (total > 0) {
            document.getElementById('workingPercent').textContent = `${Math.round(active/total*100)}% of total`;
            document.getElementById('faultyPercent').textContent = `${Math.round(faulty/total*100)}% of total`;
            document.getElementById('maintenancePercent').textContent = `${Math.round(maintenance/total*100)}% of total`;
            document.getElementById('disposedPercent').textContent = `${Math.round(disposed/total*100)}% of total`;
        }
        
    } catch (error) {
        console.error('Asset stats error:', error);
    }
}


async function loadCategoryStats() {
    try {
        const { data: assets, error } = await applyDeptScope(db
            .from('ict_assets')
            .select('category_id, categories(name)'));
        
        if (error) throw error;
        
        const categoryCount = {};
        assets.forEach(asset => {
            const categoryName = asset.categories?.name || 'Uncategorized';
            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
        });
        
        const total = assets.length;
        const container = document.getElementById('categoryChart');
        
        if (Object.keys(categoryCount).length === 0) {
            container.innerHTML = '<div class="text-muted text-center" style="padding: 20px;">No data available</div>';
            return;
        }
        
        // Render as progress bars like in the JSX design
        container.innerHTML = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => `
                <div class="progress-item">
                    <div class="progress-label">${escapeHtml(name)}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${(count/total*100).toFixed(1)}%"></div>
                    </div>
                    <div class="progress-count">${count}</div>
                </div>
            `).join('');
        
    } catch (error) {
        console.error('Category stats error:', error);
    }
}

async function loadSystemAlerts() {
    try {
        const today = new Date();
        const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
        const todayStr = today.toISOString().split('T')[0];
        const in60Str = in60Days.toISOString().split('T')[0];

        // Hardware warranty expiring within 60 days (dept-scoped for reps)
        const { data: warrantyAssets } = await applyDeptScope(db
            .from('ict_assets')
            .select('id, name, asset_tag, warranty_expiry')
            .neq('status', 'disposed')
            .gte('warranty_expiry', todayStr)
            .lte('warranty_expiry', in60Str)
            .order('warranty_expiry'));

        // Software licenses — admins/technicians only (dept reps don't have software access)
        let softwareExpiring = [];
        if (currentProfile?.role !== ROLES.DEPARTMENT_REP) {
            const { data } = await db
                .from('software_assets')
                .select('id, name, vendor, license_expiry')
                .eq('status', 'active')
                .gte('license_expiry', todayStr)
                .lte('license_expiry', in60Str)
                .order('license_expiry');
            softwareExpiring = data || [];
        }

        // Overdue maintenance (scheduled date passed, still scheduled)
        const { data: overdueMaintenance } = await db
            .from('maintenance_records')
            .select('id, ict_assets(name, asset_tag), scheduled_date')
            .eq('status', 'scheduled')
            .lt('scheduled_date', todayStr)
            .order('scheduled_date');

        const alerts = [];

        if (warrantyAssets && warrantyAssets.length > 0) {
            alerts.push({
                icon: 'bi-shield-exclamation',
                color: 'warning',
                title: `${warrantyAssets.length} Warranty Expir${warrantyAssets.length === 1 ? 'y' : 'ies'} Within 60 Days`,
                items: warrantyAssets.map(a => `<strong>${escapeHtml(a.asset_tag)}</strong> — ${escapeHtml(a.name)} <span class="text-muted">(${formatDate(a.warranty_expiry)})</span>`),
                link: 'assets.html'
            });
        }

        if (softwareExpiring && softwareExpiring.length > 0) {
            alerts.push({
                icon: 'bi-file-earmark-code',
                color: 'warning',
                title: `${softwareExpiring.length} Software License${softwareExpiring.length === 1 ? '' : 's'} Expiring Within 60 Days`,
                items: softwareExpiring.map(s => `<strong>${escapeHtml(s.name)}</strong>${s.vendor ? ` — ${escapeHtml(s.vendor)}` : ''} <span class="text-muted">(${formatDate(s.license_expiry)})</span>`),
                link: 'software.html'
            });
        }

        if (overdueMaintenance && overdueMaintenance.length > 0) {
            alerts.push({
                icon: 'bi-tools',
                color: 'danger',
                title: `${overdueMaintenance.length} Overdue Maintenance Record${overdueMaintenance.length === 1 ? '' : 's'}`,
                items: overdueMaintenance.map(m => `<strong>${escapeHtml(m.ict_assets?.asset_tag || '?')}</strong> — ${escapeHtml(m.ict_assets?.name || 'Unknown')} <span class="text-muted">(Scheduled: ${formatDate(m.scheduled_date)})</span>`),
                link: 'maintenance.html'
            });
        }

        const section = document.getElementById('systemAlertsSection');
        const grid = document.getElementById('systemAlertsGrid');

        if (alerts.length === 0 || !section || !grid) return;

        section.style.display = 'block';
        grid.innerHTML = alerts.map(alert => `
            <div class="card" style="border-left: 4px solid var(--color-${alert.color}); border-radius: var(--radius-md);">
                <div class="card-body" style="padding: 16px 20px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <i class="bi ${alert.icon}" style="font-size:18px; color:var(--color-${alert.color});"></i>
                        <span style="font-weight:600; font-size:13px;">${alert.title}</span>
                        <a href="${alert.link}" style="margin-left:auto; font-size:12px; color:var(--color-text-muted);">View all →</a>
                    </div>
                    <ul style="margin:0; padding-left:18px; font-size:12px; color:var(--color-text-secondary);">
                        ${alert.items.slice(0, 4).map(item => `<li style="margin-bottom:4px;">${item}</li>`).join('')}
                        ${alert.items.length > 4 ? `<li style="color:var(--color-text-muted);">+${alert.items.length - 4} more…</li>` : ''}
                    </ul>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('System alerts error:', error);
    }
}

async function loadRecentFaults() {
    try {
        // For dept reps, restrict to their department's assets
        let assetIdFilter = null;
        if (currentProfile?.role === ROLES.DEPARTMENT_REP && currentProfile.department_id) {
            const { data: deptAssets } = await db
                .from('ict_assets')
                .select('id')
                .eq('department_id', currentProfile.department_id);
            assetIdFilter = (deptAssets || []).map(a => a.id);
            if (assetIdFilter.length === 0) {
                document.getElementById('recentFaultsContainer').innerHTML = '<div class="text-muted text-center" style="padding: 20px;">No recent faults</div>';
                return;
            }
        }

        let q = db.from('fault_reports')
            .select(`
                *,
                ict_assets(name, asset_tag, departments(name))
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        if (assetIdFilter) q = q.in('asset_id', assetIdFilter);
        const { data: faults, error } = await q;
        
        if (error) throw error;
        
        const container = document.getElementById('recentFaultsContainer');
        
        if (!faults || faults.length === 0) {
            container.innerHTML = '<div class="text-muted text-center" style="padding: 20px;">No recent faults</div>';
            return;
        }
        
        // Render as list items like in the JSX design
        container.innerHTML = faults.map(fault => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-border-light);">
                <div>
                    <div style="font-size: 13px; font-weight: 500;">${escapeHtml(fault.ict_assets?.name || 'Unknown')}</div>
                    <div style="font-size: 11px; color: var(--color-text-secondary);">
                        ${escapeHtml(fault.ict_assets?.departments?.name || '')} · ${formatDate(fault.created_at)}
                    </div>
                </div>
                <span class="badge badge-${fault.status}">${formatStatus(fault.status)}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Recent faults error:', error);
    }
}
