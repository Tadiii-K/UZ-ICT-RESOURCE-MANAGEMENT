// Reports Module

let currentReportData = [];
let currentReportType = '';

document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async () => {
        if (currentProfile) {
            // Page is ready, no initial load needed
        }
    }, 500);
});

async function generateReport(type) {
    currentReportType = type;
    
    try {
        showLoading(true);
        
        let data = [];
        let title = '';
        let columns = [];
        
        switch (type) {
            case 'all-assets':
                title = 'All Assets Report';
                columns = ['Asset Tag', 'Name', 'Category', 'Department', 'Status', 'Assigned User', 'Location'];
                data = await fetchAllAssets();
                break;
                
            case 'faulty-assets':
                title = 'Faulty Assets Report';
                columns = ['Asset Tag', 'Name', 'Category', 'Department', 'Assigned User', 'Location'];
                data = await fetchFaultyAssets();
                break;
                
            case 'maintenance':
                title = 'Assets Under Maintenance Report';
                columns = ['Asset Tag', 'Name', 'Category', 'Department', 'Maintenance Type', 'Technician'];
                data = await fetchMaintenanceAssets();
                break;
                
            case 'by-department':
                title = 'Assets by Department Report';
                columns = ['Department', 'Total Assets', 'Active', 'Faulty', 'Under Maintenance'];
                data = await fetchAssetsByDepartment();
                break;
                
            case 'allocations':
                title = 'Allocation History Report';
                columns = ['Date', 'Asset', 'From Department', 'To Department', 'Allocated By', 'Notes'];
                data = await fetchAllocationHistory();
                break;
                
            case 'fault-reports':
                title = 'Fault Reports';
                columns = ['Date', 'Asset', 'Description', 'Priority', 'Status', 'Reported By'];
                data = await fetchFaultReports();
                break;
                
            default:
                throw new Error('Unknown report type');
        }
        
        currentReportData = data;
        displayReport(title, columns, data);
        
    } catch (error) {
        console.error('Generate report error:', error);
        showAlert('Error generating report', 'danger');
    } finally {
        showLoading(false);
    }
}

async function fetchAllAssets() {
    const { data, error } = await db
        .from('ict_assets')
        .select(`
            asset_tag,
            name,
            categories(name),
            departments(name),
            status,
            assigned_user,
            location
        `)
        .order('name');
    
    if (error) throw error;
    
    return data.map(a => [
        a.asset_tag,
        a.name,
        a.categories?.name || '-',
        a.departments?.name || '-',
        formatStatus(a.status),
        a.assigned_user || '-',
        a.location || '-'
    ]);
}

async function fetchFaultyAssets() {
    const { data, error } = await db
        .from('ict_assets')
        .select(`
            asset_tag,
            name,
            categories(name),
            departments(name),
            assigned_user,
            location
        `)
        .eq('status', 'faulty')
        .order('name');
    
    if (error) throw error;
    
    return data.map(a => [
        a.asset_tag,
        a.name,
        a.categories?.name || '-',
        a.departments?.name || '-',
        a.assigned_user || '-',
        a.location || '-'
    ]);
}

async function fetchMaintenanceAssets() {
    const { data, error } = await db
        .from('maintenance_records')
        .select(`
            ict_assets(asset_tag, name, categories(name), departments(name)),
            maintenance_type,
            technician:profiles!maintenance_records_technician_id_fkey(full_name)
        `)
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(m => [
        m.ict_assets?.asset_tag || '-',
        m.ict_assets?.name || '-',
        m.ict_assets?.categories?.name || '-',
        m.ict_assets?.departments?.name || '-',
        formatStatus(m.maintenance_type),
        m.technician?.full_name || '-'
    ]);
}

async function fetchAssetsByDepartment() {
    const { data: departments, error: deptError } = await db
        .from('departments')
        .select('id, name')
        .order('name');
    
    if (deptError) throw deptError;
    
    const { data: assets, error: assetError } = await db
        .from('ict_assets')
        .select('department_id, status');
    
    if (assetError) throw assetError;
    
    return departments.map(dept => {
        const deptAssets = assets.filter(a => a.department_id === dept.id);
        return [
            dept.name,
            deptAssets.length,
            deptAssets.filter(a => a.status === 'active').length,
            deptAssets.filter(a => a.status === 'faulty').length,
            deptAssets.filter(a => a.status === 'under_maintenance').length
        ];
    });
}

async function fetchAllocationHistory() {
    const { data, error } = await db
        .from('allocations')
        .select(`
            created_at,
            ict_assets(name, asset_tag),
            from_department:departments!allocations_from_department_id_fkey(name),
            to_department:departments!allocations_to_department_id_fkey(name),
            allocated_by:profiles!allocations_allocated_by_fkey(full_name),
            notes
        `)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(a => [
        formatDate(a.created_at),
        `${a.ict_assets?.name || '-'} (${a.ict_assets?.asset_tag || '-'})`,
        a.from_department?.name || 'N/A',
        a.to_department?.name || '-',
        a.allocated_by?.full_name || '-',
        truncateText(a.notes || '-', 50)
    ]);
}

async function fetchFaultReports() {
    const { data, error } = await db
        .from('fault_reports')
        .select(`
            created_at,
            ict_assets(name, asset_tag),
            description,
            priority,
            status,
            reporter:profiles!fault_reports_reported_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(f => [
        formatDate(f.created_at),
        `${f.ict_assets?.name || '-'} (${f.ict_assets?.asset_tag || '-'})`,
        truncateText(f.description, 50),
        formatStatus(f.priority),
        formatStatus(f.status),
        f.reporter?.full_name || '-'
    ]);
}

function displayReport(title, columns, data) {
    document.getElementById('reportTitle').textContent = title;
    
    const container = document.getElementById('reportTableContainer');
    
    if (data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4">No data available for this report</div>';
    } else {
        container.innerHTML = `
            <table class="table table-sm table-striped mb-0">
                <thead class="table-light">
                    <tr>
                        ${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="p-3 bg-light border-top">
                <small class="text-muted">Total records: ${data.length} | Generated: ${new Date().toLocaleString()}</small>
            </div>
        `;
    }
    
    document.getElementById('reportPreviewCard').classList.remove('d-none');
    
    // Scroll to report
    document.getElementById('reportPreviewCard').scrollIntoView({ behavior: 'smooth' });
}

function exportToHTML() {
    if (currentReportData.length === 0) {
        showAlert('No data to export', 'warning');
        return;
    }
    
    const title = document.getElementById('reportTitle').textContent;
    const tableHtml = document.getElementById('reportTableContainer').innerHTML;
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - UZ ICT RMS</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 20px; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
        .header h1 { color: #003366; font-size: 1.5rem; }
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>University of Zimbabwe - ICT Resource Management System</h1>
        <h2>${escapeHtml(title)}</h2>
        <p class="text-muted">Generated: ${new Date().toLocaleString()}</p>
    </div>
    ${tableHtml}
    <div class="mt-4 no-print">
        <button class="btn btn-primary" onclick="window.print()">Print Report</button>
    </div>
</body>
</html>
    `;
    
    downloadFile(htmlContent, `${title.replace(/\s+/g, '_')}.html`, 'text/html');
}

function exportToCSV() {
    if (currentReportData.length === 0) {
        showAlert('No data to export', 'warning');
        return;
    }
    
    const title = document.getElementById('reportTitle').textContent;
    
    // Get column headers from the table
    const headerCells = document.querySelectorAll('#reportTableContainer thead th');
    const headers = Array.from(headerCells).map(th => th.textContent);
    
    // Build CSV content
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    
    currentReportData.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    downloadFile(csvContent, `${title.replace(/\s+/g, '_')}.csv`, 'text/csv');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
