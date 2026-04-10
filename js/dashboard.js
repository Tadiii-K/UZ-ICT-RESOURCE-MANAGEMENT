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
        
        await Promise.all([
            loadAssetStats(),
            loadCategoryStats(),
            loadRecentFaults(),
            loadOpenFaultsCount()
        ]);
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Error loading dashboard data', 'danger');
    } finally {
        showLoading(false);
    }
}

async function loadAssetStats() {
    try {
        // Total assets
        const { count: totalCount } = await db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true });
        
        // Active assets
        const { count: activeCount } = await db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');
        
        // Faulty assets
        const { count: faultyCount } = await db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'faulty');
        
        // Under maintenance
        const { count: maintenanceCount } = await db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'under_maintenance');
        
        // Disposed
        const { count: disposedCount } = await db
            .from('ict_assets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'disposed');
        
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

async function loadOpenFaultsCount() {
    try {
        const { count } = await db
            .from('fault_reports')
            .select('*', { count: 'exact', head: true })
            .in('status', ['reported', 'in_progress']);
        
        document.getElementById('openFaults').textContent = count || 0;
    } catch (error) {
        console.error('Open faults count error:', error);
    }
}

async function loadCategoryStats() {
    try {
        const { data: assets, error } = await db
            .from('ict_assets')
            .select('category_id, categories(name)');
        
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

async function loadRecentFaults() {
    try {
        const { data: faults, error } = await db
            .from('fault_reports')
            .select(`
                *,
                ict_assets(name, asset_tag, departments(name))
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
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
