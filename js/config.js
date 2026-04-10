// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://nshlfgudcneclpiuxhkd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zaGxmZ3VkY25lY2xwaXV4aGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzE0MTYsImV4cCI6MjA5MTMwNzQxNn0.pR2Es4F_T6aQHDSv9xyB6KnBMmcRGik_4YsPgNiep8Q';

// Initialize Supabase client - using the global 'supabase' from the CDN
const _supabaseLib = window.supabase;
const db = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Application Configuration
const APP_CONFIG = {
    appName: 'UZ ICT Resource Management System',
    version: '1.0.0',
    dateFormat: 'en-GB',
    currency: 'USD'
};

// Role definitions
const ROLES = {
    ADMIN: 'admin',
    TECHNICIAN: 'technician',
    DEPARTMENT_REP: 'department_rep'
};

// Status definitions
const ASSET_STATUS = {
    ACTIVE: 'active',
    FAULTY: 'faulty',
    UNDER_MAINTENANCE: 'under_maintenance',
    DISPOSED: 'disposed'
};

const FAULT_STATUS = {
    REPORTED: 'reported',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
};

const MAINTENANCE_STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

const MAINTENANCE_TYPES = {
    PREVENTIVE: 'preventive',
    CORRECTIVE: 'corrective',
    EMERGENCY: 'emergency'
};

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(APP_CONFIG.dateFormat, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(APP_CONFIG.dateFormat, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: APP_CONFIG.currency
    }).format(amount);
}

function getStatusBadgeClass(status) {
    if (!status) return 'badge-info';
    return 'badge-' + status;
}

function formatStatus(status) {
    if (!status) return '-';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.innerHTML = alertHtml;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alertEl = document.getElementById(alertId);
        if (alertEl) {
            alertEl.remove();
        }
    }, 5000);
}

function showLoading(show = true) {
    let overlay = document.getElementById('loadingOverlay');
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'spinner-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength = 50) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
