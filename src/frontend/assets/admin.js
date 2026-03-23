// Admin Dashboard JavaScript
// Configuration - Will be updated when backend is ready
const CONFIG = {
    API_BASE_URL: 'https://bkewzxu3tc.execute-api.us-east-1.amazonaws.com/dev',
    DEMO_MODE: false, // Start in demo mode, will try backend and fallback gracefully
    REFRESH_INTERVAL: 30000, // 30 seconds
    AUTO_FALLBACK: true // Automatically switch to demo mode if backend fails
};

// Global data storage
let allLinks = [];
let filteredLinks = [];
let refreshTimer = null;

// DOM Elements - with error checking
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id '${id}' not found`);
    }
    return element;
}

const totalLinksEl = getElement('totalLinks');
const totalClicksEl = getElement('totalClicks');
const averageClicksEl = getElement('averageClicks');
const todayLinksEl = getElement('todayLinks');
const searchInput = getElement('searchInput');
const refreshBtn = getElement('refreshBtn');
const exportBtn = getElement('exportBtn');
const linksTableBody = getElement('linksTableBody');
const apiModal = getElement('apiModal');
const apiBaseUrl = getElement('apiBaseUrl');
const apiStatus = getElement('apiStatus');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    console.log('📊 Admin Dashboard initialized');
    
    // Set up event listeners
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    // Set up modal
    if (apiModal) {
        apiModal.addEventListener('click', (e) => {
            if (e.target === apiModal || e.target.classList.contains('close')) {
                hideApiModal();
            }
        });
    }
    
    // Test backend connectivity first
    await testBackendConnectivity();
    
    // Update API info
    if (apiBaseUrl) apiBaseUrl.textContent = CONFIG.API_BASE_URL;
    if (apiStatus) apiStatus.textContent = CONFIG.DEMO_MODE ? 'Demo Mode' : 'Connected';
    
    console.log(`📡 Demo Mode: ${CONFIG.DEMO_MODE ? 'ON' : 'OFF'}`);
    
    // Load initial data
    await loadLinks();
    
    // Set up auto-refresh
    if (!CONFIG.DEMO_MODE) {
        startAutoRefresh();
    }
}

// Test Backend Connectivity
async function testBackendConnectivity() {
    try {
        console.log('🔍 Testing backend connectivity...');
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/links`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                CONFIG.DEMO_MODE = false;
                showSuccess('✅ Connected to live backend!');
                console.log('✅ Backend is live and working');
                return;
            }
        }
    } catch (error) {
        console.log('⚠️ Backend not available, using demo mode');
    }
    
    CONFIG.DEMO_MODE = true;
    console.log('⚠️ Using demo mode - backend not available');
}

// Load Links Data
async function loadLinks() {
    setRefreshLoading(true);
    
    try {
        let data;
        
        if (CONFIG.DEMO_MODE) {
            data = await loadMockData();
        } else {
            data = await loadRealData();
        }
        
        allLinks = data.links || [];
        filteredLinks = [...allLinks];
        
        updateStatistics(data.statistics);
        renderLinksTable();
        
    } catch (error) {
        console.error('Error loading links:', error);
        showError('Failed to load links data');
    } finally {
        setRefreshLoading(false);
    }
}

// Mock Data for Demo Mode
async function loadMockData() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate mock links
    const mockLinks = [
        {
            code: 'demo1',
            target_url: 'https://www.google.com',
            click_count: 42,
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            custom_code: false
        },
        {
            code: 'github',
            target_url: 'https://github.com/user/repo',
            click_count: 15,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            custom_code: true
        },
        {
            code: 'demo2',
            target_url: 'https://www.stackoverflow.com/questions/12345',
            click_count: 8,
            created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            custom_code: false
        },
        {
            code: 'docs',
            target_url: 'https://docs.aws.amazon.com/lambda/',
            click_count: 23,
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            custom_code: true
        },
        {
            code: 'demo3',
            target_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            click_count: 156,
            created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            custom_code: false
        }
    ];
    
    // Add recent links from localStorage if any
    const recentLinks = getRecentLinksFromStorage();
    const demoRecentLinks = recentLinks
        .filter(link => link.isDemo)
        .map(link => ({
            code: link.shortCode,
            target_url: link.targetUrl,
            click_count: Math.floor(Math.random() * 10),
            created_at: link.createdAt,
            custom_code: link.shortCode.length > 6
        }));
    
    const allMockLinks = [...mockLinks, ...demoRecentLinks];
    
    // Calculate statistics
    const totalClicks = allMockLinks.reduce((sum, link) => sum + (link.click_count || 0), 0);
    const averageClicks = allMockLinks.length > 0 ? totalClicks / allMockLinks.length : 0;
    const today = new Date().toDateString();
    const todayLinks = allMockLinks.filter(link => 
        new Date(link.created_at).toDateString() === today
    ).length;
    
    return {
        success: true,
        links: allMockLinks,
        statistics: {
            totalLinks: allMockLinks.length,
            totalClicks: totalClicks,
            averageClicks: parseFloat(averageClicks.toFixed(2)), // Round to 2 decimal places
            todayLinks: todayLinks
        }
    };
}

// Real API Call (for when backend is ready)
async function loadRealData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/links`);
        
        // Check if we got a "Not Found" or other API Gateway error
        if (response.status === 404 || response.status === 403) {
            throw new Error('BACKEND_NOT_READY');
        }
        
        const data = await response.json();
        
        // Check for API Gateway error responses
        if (data.message === "Not Found" || data.message === "Forbidden") {
            throw new Error('BACKEND_NOT_READY');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load links');
        }
        
        return data;
        
    } catch (error) {
        if (error.message === 'BACKEND_NOT_READY' && CONFIG.AUTO_FALLBACK) {
            console.warn('Backend not ready, falling back to demo mode');
            showWarning('Backend is still being configured. Showing demo data for now.');
            CONFIG.DEMO_MODE = true;
            return await loadMockData();
        }
        throw error;
    }
}

// Update Statistics Display
function updateStatistics(stats) {
    if (totalLinksEl) totalLinksEl.textContent = stats.totalLinks || 0;
    if (totalClicksEl) totalClicksEl.textContent = stats.totalClicks || 0;
    if (averageClicksEl) averageClicksEl.textContent = stats.averageClicks || 0;
    if (todayLinksEl) todayLinksEl.textContent = stats.todayLinks || 0;
}

// Render Links Table
function renderLinksTable() {
    if (!linksTableBody) return;
    
    if (filteredLinks.length === 0) {
        linksTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">
                    ${allLinks.length === 0 ? 'No links found' : 'No links match your search'}
                </td>
            </tr>
        `;
        return;
    }
    
    linksTableBody.innerHTML = filteredLinks.map(link => `
        <tr>
            <td class="code-cell">
                <div style="font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #3b82f6; margin-bottom: 0.25rem;">
                    ${link.code}
                </div>
                <button onclick="copyToClipboard('${getShortUrl(link.code)}')" 
                        style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: #f1f5f9; border-radius: 3px; cursor: pointer;" 
                        title="Copy short URL">Copy</button>
            </td>
            <td class="url-cell" title="${link.target_url}">
                <a href="${link.target_url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none;">
                    ${truncateUrl(link.target_url, 40)}
                </a>
            </td>
            <td class="clicks-cell">
                <strong style="color: #059669;">${link.click_count || 0}</strong>
            </td>
            <td class="date-cell" style="font-size: 0.85rem;">${formatDate(link.created_at)}</td>
            <td style="font-size: 0.85rem;">
                <span class="custom-badge ${link.custom_code ? 'custom-yes' : 'custom-no'}">
                    ${link.custom_code ? 'Custom' : 'Generated'}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 0.2rem; flex-wrap: wrap;">
                    <button onclick="showQRCode('${getShortUrl(link.code)}')" 
                            style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: #3b82f6; color: white; border-radius: 3px; cursor: pointer;"
                            title="Show QR Code">QR</button>
                    <button onclick="viewLinkDetails('${link.code}')" 
                            style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: #6366f1; color: white; border-radius: 3px; cursor: pointer;"
                            title="View details">View</button>
                    <button onclick="deleteLinkConfirm('${link.code}')" 
                            style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: #ef4444; color: white; border-radius: 3px; cursor: pointer;"
                            title="Delete link">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Search Functionality
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        filteredLinks = [...allLinks];
    } else {
        filteredLinks = allLinks.filter(link => 
            link.code.toLowerCase().includes(query) ||
            link.target_url.toLowerCase().includes(query)
        );
    }
    
    renderLinksTable();
}

// Refresh Data
async function refreshData() {
    await loadLinks();
}

// Export Data
function exportData() {
    if (allLinks.length === 0) {
        showError('No data to export');
        return;
    }
    
    const csvContent = [
        ['Short Code', 'Target URL', 'Clicks', 'Created', 'Custom Code', 'Type'],
        ...allLinks.map(link => [
            link.code,
            link.target_url,
            link.click_count || 0,
            link.created_at,
            link.custom_code ? 'Yes' : 'No',
            CONFIG.DEMO_MODE ? 'Demo' : 'Live'
        ])
    ].map(row => 
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `url-shortener-links-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Data exported successfully!');
}

// Utility Functions
function getShortUrl(code) {
    return `${CONFIG.API_BASE_URL}/${code}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
}

function getRecentLinksFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('recentLinks') || '[]');
    } catch (error) {
        return [];
    }
}

// Loading State
function setRefreshLoading(loading) {
    if (refreshBtn) {
        refreshBtn.disabled = loading;
        refreshBtn.textContent = loading ? 'Loading...' : 'Refresh';
    }
}

// Auto Refresh
function startAutoRefresh() {
    refreshTimer = setInterval(async () => {
        try {
            await loadLinks();
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Global Functions for onclick handlers
window.copyToClipboard = async function(text) {
    const button = event.target;
    const originalText = button.textContent;
    
    try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            button.textContent = '✅';
            button.style.background = '#27ae60';
            showSuccess('Link copied to clipboard!');
        } else {
            throw new Error('Clipboard API not available');
        }
    } catch (error) {
        console.log('Modern clipboard failed, trying fallback:', error);
        // Fallback for older browsers or security restrictions
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                button.textContent = '✅';
                button.style.background = '#27ae60';
                showSuccess('Link copied to clipboard!');
            } else {
                throw new Error('execCommand failed');
            }
        } catch (fallbackError) {
            console.error('All copy methods failed:', fallbackError);
            // Final fallback - show the URL for manual copying
            button.textContent = '📋';
            showError(`Copy failed. Please copy manually: ${text}`);
        }
    }
    
    // Reset button after 2 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
};

window.viewLinkDetails = function(code) {
    const link = allLinks.find(l => l.code === code);
    if (!link) return;
    
    const details = `
Short Code: ${link.code}
Target URL: ${link.target_url}
Clicks: ${link.click_count || 0}
Created: ${formatDate(link.created_at)}
Type: ${link.custom_code ? 'Custom' : 'Generated'}
${CONFIG.DEMO_MODE ? 'Mode: Demo' : ''}
    `.trim();
    
    alert(details);
};

window.deleteLinkConfirm = function(code) {
    if (confirm(`Are you sure you want to delete the link "${code}"? This action cannot be undone.`)) {
        deleteLink(code);
    }
};

async function deleteLink(code) {
    try {
        // For now, we'll simulate deletion by removing from the current view
        // In a real implementation, this would call a DELETE API endpoint
        
        // Remove from current data arrays
        allLinks = allLinks.filter(link => link.code !== code);
        filteredLinks = filteredLinks.filter(link => link.code !== code);
        
        // Update localStorage if it's a recent link
        const recentLinks = getRecentLinksFromStorage();
        const updatedRecentLinks = recentLinks.filter(link => link.shortCode !== code);
        localStorage.setItem('recentLinks', JSON.stringify(updatedRecentLinks));
        
        // Re-render table and update stats
        renderLinksTable();
        
        // Recalculate statistics
        const totalClicks = allLinks.reduce((sum, link) => sum + (link.click_count || 0), 0);
        const averageClicks = allLinks.length > 0 ? totalClicks / allLinks.length : 0;
        const today = new Date().toDateString();
        const todayLinks = allLinks.filter(link => 
            new Date(link.created_at).toDateString() === today
        ).length;
        
        updateStatistics({
            totalLinks: allLinks.length,
            totalClicks: totalClicks,
            averageClicks: parseFloat(averageClicks.toFixed(2)),
            todayLinks: todayLinks
        });
        
        showSuccess(`Link "${code}" has been removed from the current view`);
        
    } catch (error) {
        console.error('Delete failed:', error);
        showError('Failed to delete link');
    }
}



window.showQRCode = function(url) {
    // Create modal for QR code
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;
    
    content.innerHTML = `
        <h3 style="margin-bottom: 1rem; color: #1e293b;">QR Code</h3>
        <div id="qrContainer" style="margin: 1rem 0;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" 
                 alt="QR Code" 
                 style="width: 200px; height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
                 onload="console.log('QR Code loaded successfully')"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; background: #f8f9fa;">
                <p style="color: #666; margin-bottom: 10px;">⚠️ QR Code temporarily unavailable</p>
                <p style="color: #888; font-size: 0.9rem;">URL: ${url}</p>
            </div>
        </div>
        <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem; word-break: break-all;">${url}</p>
        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
            Close
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Modal Functions
window.showApiInfo = function() {
    if (apiModal) {
        apiModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

function hideApiModal() {
    if (apiModal) {
        apiModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Notification Functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    const colors = {
        error: '#e74c3c',
        success: '#27ae60',
        info: '#3498db',
        warning: '#f39c12'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});