// URL Shortener Frontend Application
// Configuration - Will be updated when backend is ready
const CONFIG = {
    API_BASE_URL: 'https://bkewzxu3tc.execute-api.us-east-1.amazonaws.com/dev',
    DEMO_MODE: false, // Start in demo mode, will try backend and fallback gracefully
    SHORT_DOMAIN: 'short.ly',
    AUTO_FALLBACK: true // Automatically switch to demo mode if backend fails
};

// DOM Elements - with error checking
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id '${id}' not found`);
    }
    return element;
}

const shortenForm = getElement('shortenForm');
const urlInput = getElement('urlInput');
const customCodeInput = getElement('customCodeInput');
const shortenBtn = getElement('shortenBtn');
const btnText = getElement('btnText');
const btnLoader = getElement('btnLoader');
const result = getElement('result');
const shortUrlInput = getElement('shortUrlInput');
const copyBtn = getElement('copyBtn');
const qrCanvas = getElement('qrCanvas');
const recentLinksList = getElement('recentLinksList');
const clearHistoryBtn = getElement('clearHistoryBtn');
const clickCount = getElement('clickCount');
const createdDate = getElement('createdDate');
const aboutBtn = getElement('aboutBtn');
const aboutModal = getElement('aboutModal');

// Event Listeners - with error checking
document.addEventListener('DOMContentLoaded', initializeApp);

if (shortenForm) shortenForm.addEventListener('submit', handleShortenUrl);
if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
if (aboutBtn) aboutBtn.addEventListener('click', showAboutModal);

// Modal event listeners
if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal || e.target.classList.contains('close')) {
            hideAboutModal();
        }
    });
}

// Initialize Application
async function initializeApp() {
    try {
        loadRecentLinks();
        
        // Add input validation
        if (urlInput) urlInput.addEventListener('input', validateUrl);
        if (customCodeInput) customCodeInput.addEventListener('input', validateCustomCode);
        
        // Test QR Code library
        console.log('QRCode library available:', typeof QRCode !== 'undefined');
        if (typeof QRCode !== 'undefined') {
            console.log('QRCode version:', QRCode.version || 'unknown');
        }
        
        // Test backend connectivity
        await testBackendConnectivity();
        
        console.log('🔗 URL Shortener initialized');
        console.log(`📡 Demo Mode: ${CONFIG.DEMO_MODE ? 'ON' : 'OFF'}`);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
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
    showWarning('⚠️ Using demo mode - backend not available');
}

// Main URL Shortening Handler
async function handleShortenUrl(event) {
    event.preventDefault();
    
    const url = urlInput.value.trim();
    const customCode = customCodeInput.value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    
    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (must start with http:// or https://)');
        return;
    }
    
    // Show loading state
    setLoading(true);
    
    try {
        let linkData;
        
        if (CONFIG.DEMO_MODE) {
            // Demo mode - use mock data
            linkData = await createMockLink(url, customCode);
        } else {
            // Production mode - call actual API
            linkData = await createRealLink(url, customCode);
        }
        
        displayResult(linkData);
        saveToRecentLinks(linkData);
        loadRecentLinks();
        
        // Reset form
        shortenForm.reset();
        
    } catch (error) {
        console.error('Error creating short link:', error);
        showError(error.message || 'Failed to create short link. Please try again.');
    } finally {
        setLoading(false);
    }
}

// Mock API for Demo Mode
async function createMockLink(url, customCode) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shortCode = customCode || generateRandomCode();
    const timestamp = new Date().toISOString();
    
    // Simulate potential errors
    if (customCode && getMockLinks().some(link => link.shortCode === customCode)) {
        throw new Error('Custom code already exists');
    }
    
    return {
        success: true,
        shortCode: shortCode,
        shortUrl: `${CONFIG.SHORT_DOMAIN}/${shortCode}`,
        targetUrl: url,
        createdAt: timestamp,
        clickCount: 0,
        isDemo: true
    };
}

// Real API Call (for when backend is ready)
async function createRealLink(url, customCode) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                customCode: customCode || undefined
            })
        });
        
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
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to create short link');
        }
        
        return data;
        
    } catch (error) {
        if (error.message === 'BACKEND_NOT_READY' && CONFIG.AUTO_FALLBACK) {
            console.warn('Backend not ready, falling back to demo mode');
            showWarning('Backend is still being configured. Using demo mode for now.');
            CONFIG.DEMO_MODE = true;
            return await createMockLink(url, customCode);
        }
        throw error;
    }
}

// Display Result
function displayResult(data) {
    if (shortUrlInput) shortUrlInput.value = data.shortUrl;
    if (clickCount) clickCount.textContent = data.clickCount || 0;
    if (createdDate) createdDate.textContent = formatDate(data.createdAt);
    
    // Generate QR code - simplified approach
    if (qrCanvas) {
        generateQRCode(qrCanvas, data.shortUrl);
    }
    
    if (result) {
        result.classList.remove('hidden');
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Copy to Clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(shortUrlInput.value);
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#27ae60';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        // Fallback for older browsers
        shortUrlInput.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }
}

// Loading State Management
function setLoading(loading) {
    if (shortenBtn) shortenBtn.disabled = loading;
    if (btnText) btnText.classList.toggle('hidden', loading);
    if (btnLoader) btnLoader.classList.toggle('hidden', !loading);
}

// Recent Links Management
function saveToRecentLinks(linkData) {
    let recentLinks = getRecentLinks();
    
    // Add new link to beginning
    recentLinks.unshift({
        ...linkData,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 links
    recentLinks = recentLinks.slice(0, 10);
    
    localStorage.setItem('recentLinks', JSON.stringify(recentLinks));
}

function getRecentLinks() {
    try {
        return JSON.parse(localStorage.getItem('recentLinks') || '[]');
    } catch (error) {
        console.error('Error parsing recent links:', error);
        return [];
    }
}

async function loadRecentLinks() {
    if (!recentLinksList) return;
    
    const recentLinks = getRecentLinks();
    
    if (recentLinks.length === 0) {
        recentLinksList.innerHTML = '<p class="empty-state">No recent links</p>';
        if (clearHistoryBtn) clearHistoryBtn.classList.add('hidden');
        return;
    }
    
    // Update click counts from backend if available
    const updatedLinks = await updateClickCounts(recentLinks);
    
    recentLinksList.innerHTML = updatedLinks.map((link, index) => `
        <div class="link-item" data-index="${index}">
            <div class="link-info">
                <div class="link-short">${link.shortUrl}</div>
                <div class="link-target">${truncateUrl(link.targetUrl, 60)}</div>
                <div class="link-meta">
                    ${formatDate(link.timestamp)} • <span class="click-count">${link.clickCount || 0}</span> clicks
                    ${link.isDemo ? ' • Demo' : ''}
                </div>
            </div>
            <div class="link-actions">
                <button onclick="copyLink('${link.shortUrl}')" title="Copy link">📋</button>
                <button onclick="removeLink(${index})" title="Remove" style="background: #e74c3c;">🗑️</button>
            </div>
        </div>
    `).join('');
    
    if (clearHistoryBtn) clearHistoryBtn.classList.remove('hidden');
}

// Update click counts from backend
async function updateClickCounts(recentLinks) {
    if (CONFIG.DEMO_MODE) {
        return recentLinks; // In demo mode, use stored counts
    }
    
    try {
        // Fetch latest data from admin endpoint
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/links`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.links) {
                // Update click counts for matching links
                const updatedLinks = recentLinks.map(recentLink => {
                    const shortCode = recentLink.shortCode || extractShortCode(recentLink.shortUrl);
                    const backendLink = data.links.find(bl => bl.code === shortCode);
                    if (backendLink) {
                        return {
                            ...recentLink,
                            clickCount: backendLink.click_count || 0
                        };
                    }
                    return recentLink;
                });
                
                // Save updated counts to localStorage
                localStorage.setItem('recentLinks', JSON.stringify(updatedLinks));
                return updatedLinks;
            }
        }
    } catch (error) {
        console.log('Could not update click counts:', error);
    }
    
    return recentLinks; // Return original if update fails
}

// Extract short code from URL
function extractShortCode(url) {
    const parts = url.split('/');
    return parts[parts.length - 1];
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all recent links?')) {
        localStorage.removeItem('recentLinks');
        loadRecentLinks();
    }
}

function removeLink(index) {
    let recentLinks = getRecentLinks();
    recentLinks.splice(index, 1);
    localStorage.setItem('recentLinks', JSON.stringify(recentLinks));
    loadRecentLinks();
}

// Global function for inline onclick handlers
window.copyLink = async function(url) {
    const button = event.target;
    const originalText = button.textContent;
    
    try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
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
            textArea.value = url;
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
            showError(`Copy failed. Please copy manually: ${url}`);
        }
    }
    
    // Reset button after 2 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
};

window.removeLink = removeLink;

// Validation Functions
function validateUrl() {
    const url = urlInput.value.trim();
    if (url && !isValidUrl(url)) {
        urlInput.setCustomValidity('Please enter a valid URL starting with http:// or https://');
    } else {
        urlInput.setCustomValidity('');
    }
}

function validateCustomCode() {
    const code = customCodeInput.value.trim();
    if (code && !isValidCustomCode(code)) {
        customCodeInput.setCustomValidity('Custom code must be 3-50 characters, letters and numbers only');
    } else {
        customCodeInput.setCustomValidity('');
    }
}

function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

function isValidCustomCode(code) {
    const regex = /^[a-zA-Z0-9]{3,50}$/;
    return regex.test(code);
}

// Utility Functions
function generateRandomCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function getMockLinks() {
    return getRecentLinks().filter(link => link.isDemo);
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
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
    
    // Set background color based on type
    const colors = {
        error: '#e74c3c',
        success: '#27ae60',
        info: '#3498db',
        warning: '#f39c12'
    };
    notification.style.background = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Modal Functions
function showAboutModal() {
    if (aboutModal) {
        aboutModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideAboutModal() {
    if (aboutModal) {
        aboutModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Simple QR Code Generation
function generateQRCode(canvas, url) {
    // First try the QR library if available
    if (typeof QRCode !== 'undefined') {
        try {
            QRCode.toCanvas(canvas, url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#333333',
                    light: '#FFFFFF'
                }
            }, (error) => {
                if (error) {
                    console.error('QR Code library failed:', error);
                    showQRImage(canvas, url);
                } else {
                    console.log('QR Code generated successfully with library');
                    canvas.style.display = 'block';
                }
            });
            return;
        } catch (error) {
            console.error('QR Code library error:', error);
        }
    }
    
    // Fallback to image-based QR code
    console.log('Using image-based QR code fallback');
    showQRImage(canvas, url);
}

function showQRImage(canvas, url) {
    const qrSection = canvas.parentElement;
    if (qrSection) {
        // Use QR Server API (more reliable than Google Charts)
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        
        qrSection.innerHTML = `
            <div style="text-align: center;">
                <img src="${qrImageUrl}" 
                     alt="QR Code for ${url}" 
                     style="width: 200px; height: 200px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: white;"
                     onload="console.log('QR Code image loaded successfully')"
                     onerror="console.error('QR Code image failed to load'); this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; background: rgba(255,255,255,0.1);">
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">⚠️ QR Code temporarily unavailable</p>
                    <p style="color: #888; font-size: 0.8rem;">You can still copy and share the short link above</p>
                </div>
            </div>
        `;
    }
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidUrl,
        isValidCustomCode,
        generateRandomCode,
        truncateUrl,
        formatDate
    };
}