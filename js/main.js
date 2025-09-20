// Main JavaScript functionality for Invasive Plant Species Monitoring System

// Global variables
let currentSection = 'dashboard';
let currentPage = 1;
let speciesData = [];
let reportsData = [];
let currentUser = null;

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
});

// Initialize the application
function initializeApp() {
    console.log('Initializing Invasive Plant Species Monitoring System...');
    
    // Show the dashboard section by default
    showSection('dashboard');
    
    // Initialize user permissions (hide restricted features by default)
    updateVerificationPermissions(null);
    
    // Initialize Tailwind config
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
                }
            }
        }
    };
}

// Set up event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Mobile navigation links
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            toggleMobileMenu(); // Close mobile menu
        });
    });
    
    // Species search and filters
    const speciesSearch = document.getElementById('species-search');
    if (speciesSearch) {
        speciesSearch.addEventListener('input', debounce(filterSpecies, 300));
    }
    
    const threatFilter = document.getElementById('threat-filter');
    if (threatFilter) {
        threatFilter.addEventListener('change', filterSpecies);
    }
    
    const habitatFilter = document.getElementById('habitat-filter');
    if (habitatFilter) {
        habitatFilter.addEventListener('change', filterSpecies);
    }
    
    // Report form
    const reportForm = document.getElementById('sighting-report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportSubmission);
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentSection = sectionName;
        
        // Update navigation active state
        updateNavigationState(sectionName);
        
        // Load section-specific data
        loadSectionData(sectionName);
    }
}

// Update navigation active state
function updateNavigationState(activeSection) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const section = link.getAttribute('data-section');
        if (section === activeSection) {
            link.classList.add('text-green-600');
            link.classList.remove('text-gray-700');
        } else {
            link.classList.remove('text-green-600');
            link.classList.add('text-gray-700');
        }
    });
}

// Load section-specific data
async function loadSectionData(sectionName) {
    showLoading();
    
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'species':
                await loadSpeciesData();
                break;
            case 'map':
                if (typeof loadMapData === 'function') {
                    // Add delay to ensure map container is visible
                    setTimeout(async () => {
                        try {
                            await loadMapData();
                        } catch (error) {
                            console.error('Map loading error:', error);
                            showError('Map failed to load. Please try refreshing the page.');
                        }
                    }, 200);
                } else {
                    console.warn('Map functionality not available');
                    showError('Map functionality is not available.');
                }
                break;
            case 'report':
                await loadReportFormData();
                break;
            case 'reports-management':
                // Check user permissions before loading reports management
                if (!currentUser) {
                    showError('Please log in to access reports management.');
                    showLogin();
                    showSection('dashboard');
                    return;
                }
                
                if (!canVerifyReports(currentUser)) {
                    showError('Access denied. Only Researchers, Administrators, and Government Officials can access reports management.');
                    showSection('dashboard');
                    return;
                }
                
                await loadReportsManagement();
                break;
            case 'analytics':
                if (typeof loadAnalyticsData === 'function') {
                    await loadAnalyticsData();
                } else {
                    console.warn('Analytics functionality not available');
                }
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
        showError('Failed to load data. Please try again.');
    } finally {
        hideLoading();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const stats = await invasiveSpeciesAPI.getSpeciesStats();
        
        // Update statistics cards
        document.getElementById('total-species').textContent = stats.totalSpecies;
        document.getElementById('active-reports').textContent = stats.activeReports;
        document.getElementById('total-contributors').textContent = stats.contributors;
        document.getElementById('monitoring-sites').textContent = stats.monitoringSites;
        
        // Show NASA integration status
        if (stats.nasa_integration && stats.nasa_integration.enabled) {
            showSuccess('NASA satellite data integration active! Enhanced environmental monitoring enabled.');
            const nasaStatus = document.getElementById('nasa-status');
            if (nasaStatus) {
                nasaStatus.classList.remove('hidden');
                nasaStatus.classList.add('flex');
            }
        }
        
        // Load recent reports
        await loadRecentReports();
        
        // Load priority alerts
        await loadPriorityAlerts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set fallback values
        document.getElementById('total-species').textContent = '0';
        document.getElementById('active-reports').textContent = '0';
        document.getElementById('total-contributors').textContent = '0';
        document.getElementById('monitoring-sites').textContent = '0';
        showError('Dashboard data unavailable. Check your connection.');
    }
}

// Load recent reports for dashboard
async function loadRecentReports() {
    try {
        const recentReports = await invasiveSpeciesAPI.getRecentReports(5);
        const container = document.getElementById('recent-reports');
        
        if (recentReports.data && recentReports.data.length > 0) {
            container.innerHTML = recentReports.data.map(report => {
                const canVerify = currentUser && canVerifyReports(currentUser) && report.verification_status === 'Pending';
                
                return `
                    <div class="border-l-4 border-blue-500 pl-4 py-2">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-medium text-gray-900">Report #${report.id?.substring(0, 8) || 'Unknown'}</p>
                                <p class="text-sm text-gray-600">${report.location_description || 'Location not specified'}</p>
                                <p class="text-xs text-gray-500">${formatDate(report.report_date || report.created_at)}</p>
                            </div>
                            <div class="flex flex-col items-end space-y-1">
                                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(report.verification_status)}">
                                    ${report.verification_status || 'Pending'}
                                </span>
                                ${canVerify ? `
                                    <button onclick="showVerificationModal('${report.id}')" 
                                            class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors">
                                        Verify
                                    </button>
                                ` : ''}
                                ${!currentUser && report.verification_status === 'Pending' ? `
                                    <p class="text-xs text-gray-500">Login to verify</p>
                                ` : ''}
                                ${currentUser && !canVerifyReports(currentUser) && report.verification_status === 'Pending' ? `
                                    <p class="text-xs text-red-500">No permission</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No recent reports available</p>';
        }
    } catch (error) {
        console.error('Error loading recent reports:', error);
        document.getElementById('recent-reports').innerHTML = '<p class="text-red-500 text-center py-4">Error loading reports</p>';
    }
}

// Load priority alerts for dashboard
async function loadPriorityAlerts() {
    try {
        const highRiskReports = await invasiveSpeciesAPI.getReportsByThreatLevel('High Risk');
        const immediateActionReports = await invasiveSpeciesAPI.getReportsByThreatLevel('Immediate Action Required');
        
        const allAlerts = [
            ...(highRiskReports.data || []),
            ...(immediateActionReports.data || [])
        ].slice(0, 5); // Show top 5 alerts
        
        const container = document.getElementById('priority-alerts');
        
        if (allAlerts.length > 0) {
            container.innerHTML = allAlerts.map(alert => `
                <div class="border-l-4 border-red-500 pl-4 py-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-medium text-gray-900">${alert.threat_assessment || 'High Priority'}</p>
                            <p class="text-sm text-gray-600">${alert.location_description || 'Location not specified'}</p>
                            <p class="text-xs text-gray-500">Population: ${alert.population_size || 'Unknown'}</p>
                        </div>
                        <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Alert
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No priority alerts at this time</p>';
        }
    } catch (error) {
        console.error('Error loading priority alerts:', error);
        document.getElementById('priority-alerts').innerHTML = '<p class="text-red-500 text-center py-4">Error loading alerts</p>';
    }
}

// Load species data for species section
async function loadSpeciesData() {
    try {
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 50 });
        speciesData = species.data || [];
        displaySpecies(speciesData);
    } catch (error) {
        console.error('Error loading species data:', error);
        showError('Failed to load species data');
    }
}

// Display species in grid format
function displaySpecies(species) {
    const container = document.getElementById('species-grid');
    
    if (!species || species.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No species found</div>';
        return;
    }
    
    container.innerHTML = species.map(s => `
        <div class="bg-white rounded-xl shadow-md overflow-hidden card-hover">
            <div class="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative">
                <i class="fas fa-seedling text-white text-4xl"></i>
                ${s.nasa_data ? `
                    <div class="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                        <i class="fas fa-satellite mr-1"></i>NASA Enhanced
                    </div>
                ` : ''}
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-lg font-semibold text-gray-900">${s.scientific_name || 'Unknown Species'}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${getThreatColor(s.threat_level)}">
                        ${s.threat_level || 'Unknown'}
                    </span>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">${(s.enhanced_description || s.description || '').substring(0, 150)}${(s.enhanced_description || s.description || '').length > 150 ? '...' : ''}</p>
                <div class="space-y-2">
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-map-marked-alt mr-2"></i>
                        <span>Native to: ${s.native_range || 'Unknown'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-calendar mr-2"></i>
                        <span>Flowers: ${s.flowering_period || 'Unknown'}</span>
                    </div>
                    ${s.satellite_monitoring ? `
                        <div class="flex items-center text-sm text-blue-600">
                            <i class="fas fa-satellite mr-2"></i>
                            <span>Satellite monitoring active</span>
                        </div>
                    ` : ''}
                </div>
                <button onclick="showSpeciesDetail('${s.id}')" class="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Filter species based on search and filters
function filterSpecies() {
    const searchTerm = document.getElementById('species-search').value.toLowerCase();
    const threatFilter = document.getElementById('threat-filter').value;
    const habitatFilter = document.getElementById('habitat-filter').value;
    
    let filtered = speciesData;
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(s => 
            (s.scientific_name || '').toLowerCase().includes(searchTerm) ||
            (s.description || '').toLowerCase().includes(searchTerm) ||
            (s.common_names || []).some(name => name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply threat level filter
    if (threatFilter) {
        filtered = filtered.filter(s => s.threat_level === threatFilter);
    }
    
    // Apply habitat filter
    if (habitatFilter) {
        filtered = filtered.filter(s => 
            (s.habitat_types || []).includes(habitatFilter)
        );
    }
    
    displaySpecies(filtered);
}

// Load report form data
async function loadReportFormData() {
    try {
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 100 });
        const speciesSelect = document.getElementById('species-select');
        
        if (speciesSelect && species.data) {
            speciesSelect.innerHTML = '<option value="">Select a species...</option>' +
                species.data.map(s => `<option value="${s.id}">${s.scientific_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading report form data:', error);
    }
}

// Handle report form submission
async function handleReportSubmission(event) {
    event.preventDefault();
    showLoading();
    
    try {
        const formData = new FormData(event.target);
        const reportData = {
            species_id: document.getElementById('species-select').value,
            confidence_level: document.getElementById('confidence-level').value,
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value),
            location_description: document.getElementById('location-description').value,
            population_size: document.getElementById('population-size').value,
            threat_assessment: document.getElementById('threat-assessment').value,
            reporter_name: document.getElementById('reporter-name').value,
            reporter_email: document.getElementById('reporter-email').value,
            reporter_type: document.getElementById('reporter-type').value,
            habitat_description: document.getElementById('habitat-description').value,
            notes: document.getElementById('additional-notes').value,
            follow_up_required: document.getElementById('follow-up-required').checked,
            verification_status: 'Pending',
            nasa_enhanced: true,
            satellite_verification_requested: true
        };
        
        await invasiveSpeciesAPI.createReport(reportData);
        showSuccess('Report submitted successfully with NASA satellite verification! Thank you for your contribution.');
        event.target.reset();
        
        // Optionally redirect to dashboard
        setTimeout(() => showSection('dashboard'), 2000);
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showError('Failed to submit report. Please try again.');
    } finally {
        hideLoading();
    }
}

// Handle login/registration
async function handleLogin(event) {
    event.preventDefault();
    showLoading();
    
    try {
        const email = document.getElementById('login-email').value;
        const name = document.getElementById('login-name').value;
        const userType = document.getElementById('login-user-type').value;
        
        const user = await invasiveSpeciesAPI.authenticateUser(email, name, userType);
        currentUser = user;
        
        showSuccess(`Welcome, ${user.full_name}!`);
        hideLogin();
        
        // Update UI to show logged-in state
        updateLoginState(user);
        
        // Refresh dashboard to show verification options if user has permission
        if (currentSection === 'dashboard') {
            await loadRecentReports();
        }
        
    } catch (error) {
        console.error('Login failed:', error);
        showError('Login failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Update UI for logged-in user
function updateLoginState(user) {
    // Update login button to show user info
    const loginButton = document.querySelector('button[onclick="showLogin()"]');
    if (loginButton) {
        loginButton.innerHTML = `
            <i class="fas fa-user mr-2"></i>${user.full_name}
            <span class="text-xs block">${user.user_type}</span>
        `;
        loginButton.onclick = showUserMenu;
    }
    
    // Show/hide verification features based on user permissions
    updateVerificationPermissions(user);
    
    console.log('User logged in:', user);
}

// Check if user has verification permissions
function canVerifyReports(user) {
    if (!user) return false;
    
    const allowedTypes = ['Researcher', 'Administrator', 'Government Official'];
    return allowedTypes.includes(user.user_type);
}

// Update verification permissions throughout the UI
function updateVerificationPermissions(user) {
    const hasPermission = canVerifyReports(user);
    
    // Update dashboard verify buttons
    const verifyButtons = document.querySelectorAll('button[onclick^="showVerificationModal"]');
    verifyButtons.forEach(button => {
        if (hasPermission) {
            button.style.display = 'inline-block';
            button.disabled = false;
        } else {
            button.style.display = 'none';
        }
    });
    
    // Update reports management access in main navigation
    const reportsManagementLinks = document.querySelectorAll('a[data-section="reports-management"]');
    reportsManagementLinks.forEach(link => {
        if (hasPermission) {
            link.style.display = 'block';
            // For inline navigation links, use inline-flex
            if (link.closest('.hidden.md\\:flex')) {
                link.style.display = 'inline-flex';
            }
        } else {
            link.style.display = 'none';
        }
    });
    
    // Update "View All Reports" button on dashboard
    const viewAllReportsButton = document.querySelector('button[onclick="showSection(\'reports-management\')"]');
    if (viewAllReportsButton) {
        if (hasPermission) {
            viewAllReportsButton.style.display = 'block';
        } else {
            viewAllReportsButton.style.display = 'none';
        }
    }
    
    // Update reports table action buttons
    const reportActionButtons = document.querySelectorAll('button[onclick^="showVerificationModal"]');
    reportActionButtons.forEach(button => {
        if (hasPermission) {
            button.style.display = 'inline-block';
            button.disabled = false;
        } else {
            button.style.display = 'none';
        }
    });
}

// Show user menu (logout option)
function showUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg z-50 min-w-48';
    menu.innerHTML = `
        <div class="p-3 border-b">
            <p class="font-semibold">${currentUser?.full_name || 'User'}</p>
            <p class="text-sm text-gray-600">${currentUser?.user_type || 'Unknown'}</p>
            <p class="text-xs text-gray-500">${currentUser?.email || ''}</p>
        </div>
        <div class="p-2">
            ${canVerifyReports(currentUser) ? `
                <div class="px-3 py-1 text-sm text-green-600">
                    <i class="fas fa-check-circle mr-2"></i>Verification Enabled
                </div>
            ` : `
                <div class="px-3 py-1 text-sm text-gray-500">
                    <i class="fas fa-lock mr-2"></i>No Verification Access
                </div>
            `}
            <button onclick="logout()" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">
                <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
        </div>
    `;
    
    // Position menu relative to login button
    const loginButton = document.querySelector('button[onclick="showUserMenu"]');
    if (loginButton) {
        loginButton.parentElement.style.position = 'relative';
        loginButton.parentElement.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== loginButton) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
}

// Logout function
function logout() {
    currentUser = null;
    invasiveSpeciesAPI.logout();
    
    // Reset login button
    const loginButton = document.querySelector('button[onclick="showUserMenu"]');
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-user mr-2"></i>Login';
        loginButton.onclick = showLogin;
    }
    
    // Hide verification features
    updateVerificationPermissions(null);
    
    // Refresh current section
    if (currentSection === 'dashboard') {
        loadRecentReports();
    } else if (currentSection === 'reports-management') {
        showSection('dashboard'); // Redirect to dashboard if on restricted section
    }
    
    // Remove any open menus
    document.querySelectorAll('.absolute.right-0.top-full').forEach(menu => menu.remove());
    
    showSuccess('Logged out successfully');
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                document.getElementById('latitude').value = position.coords.latitude.toFixed(6);
                document.getElementById('longitude').value = position.coords.longitude.toFixed(6);
                showSuccess('Location detected successfully!');
            },
            function(error) {
                console.error('Error getting location:', error);
                showError('Unable to get current location. Please enter coordinates manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// Show species detail modal (placeholder)
function showSpeciesDetail(speciesId) {
    // This would show a detailed modal with full species information
    console.log('Show species detail for:', speciesId);
    showSuccess('Species detail view coming soon!');
}

// Export data functionality
function exportData(dataType) {
    // This would implement data export functionality
    console.log('Export data:', dataType);
    showSuccess(`Exporting ${dataType} data... Feature coming soon!`);
}

// Utility functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
}

function showLogin() {
    document.getElementById('login-modal').classList.remove('hidden');
}

function hideLogin() {
    document.getElementById('login-modal').classList.add('hidden');
}

function showLoading() {
    document.getElementById('loading-spinner').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-spinner').classList.add('hidden');
}

function showSuccess(message) {
    const element = document.getElementById('success-message');
    document.getElementById('success-text').textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
}

function showError(message) {
    const element = document.getElementById('error-message');
    document.getElementById('error-text').textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'Verified': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getThreatColor(threatLevel) {
    switch (threatLevel) {
        case 'Severe': return 'bg-red-100 text-red-800';
        case 'High': return 'bg-orange-100 text-orange-800';
        case 'Moderate': return 'bg-yellow-100 text-yellow-800';
        case 'Low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
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

// Report Verification Functions
function showVerificationModal(reportId) {
    // Check if user is logged in and has permission
    if (!currentUser) {
        showError('Please log in to verify reports.');
        showLogin();
        return;
    }
    
    if (!canVerifyReports(currentUser)) {
        showError('You do not have permission to verify reports. Only Researchers, Administrators, and Government Officials can verify reports.');
        return;
    }
    
    // First get the report details
    invasiveSpeciesAPI.getReportById(reportId).then(reportData => {
        const report = reportData.data || reportData;
        
        const modal = document.createElement('div');
        modal.id = 'verification-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl max-w-4xl w-full max-h-full overflow-auto">
                <div class="p-6 border-b flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900">
                        <i class="fas fa-search mr-2 text-blue-600"></i>Verify Report #${reportId.substring(0, 8)}
                    </h3>
                    <button onclick="closeVerificationModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Verifier Info Display -->
                <div class="px-6 py-3 bg-green-50 border-b">
                    <div class="flex items-center text-sm">
                        <i class="fas fa-user-check mr-2 text-green-600"></i>
                        <span class="font-semibold">Verifying as:</span>
                        <span class="ml-2">${currentUser.full_name} (${currentUser.user_type})</span>
                    </div>
                </div>
                
                <div class="p-6">
                    <!-- Report Details -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Left Column - Report Information -->
                        <div class="space-y-4">
                            <h4 class="font-semibold text-gray-900 mb-3">Report Information</h4>
                            
                            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div><strong>Species:</strong> ${report.species_name || 'Unknown'}</div>
                                <div><strong>Reporter:</strong> ${report.reporter_name || 'Anonymous'}</div>
                                <div><strong>Email:</strong> ${report.reporter_email || 'Not provided'}</div>
                                <div><strong>Reporter Type:</strong> ${report.reporter_type || 'Unknown'}</div>
                                <div><strong>Confidence Level:</strong> ${report.confidence_level || 'Unknown'}</div>
                                <div><strong>Population Size:</strong> ${report.population_size || 'Unknown'}</div>
                                <div><strong>Threat Assessment:</strong> ${report.threat_assessment || 'Unknown'}</div>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div><strong>Location:</strong> ${report.location_description || 'Not specified'}</div>
                                <div><strong>Coordinates:</strong> ${report.latitude || 'N/A'}, ${report.longitude || 'N/A'}</div>
                                <div><strong>Habitat:</strong> ${report.habitat_description || 'Not described'}</div>
                                <div><strong>Report Date:</strong> ${formatDate(report.report_date || report.created_at)}</div>
                            </div>
                            
                            ${report.notes ? `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <strong>Additional Notes:</strong><br>
                                    ${report.notes}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Right Column - NASA Data & Verification Tools -->
                        <div class="space-y-4">
                            <h4 class="font-semibold text-gray-900 mb-3">Verification Tools</h4>
                            
                            <!-- NASA Satellite Data -->
                            ${report.nasa_data ? `
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <h5 class="font-semibold text-blue-900 mb-2">
                                        <i class="fas fa-satellite mr-2"></i>NASA Satellite Data
                                    </h5>
                                    <div class="space-y-2 text-sm">
                                        <div>✓ Earth imagery available</div>
                                        <div>✓ Environmental monitoring active</div>
                                        ${report.satellite_confirmed ? '<div class="text-green-600">✓ Satellite confirmed</div>' : ''}
                                        ${report.nasa_data.earth_imagery?.url ? `
                                            <button onclick="viewNasaImagery('${report.nasa_data.earth_imagery.url}')" 
                                                    class="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                                                View NASA Imagery
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : `
                                <div class="bg-yellow-50 p-4 rounded-lg">
                                    <h5 class="font-semibold text-yellow-900 mb-2">
                                        <i class="fas fa-exclamation-triangle mr-2"></i>Limited Satellite Data
                                    </h5>
                                    <div class="text-sm text-yellow-800">
                                        NASA satellite verification not available for this location/date.
                                    </div>
                                </div>
                            `}
                            
                            <!-- Location Map -->
                            ${report.latitude && report.longitude ? `
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <h5 class="font-semibold text-gray-900 mb-2">
                                        <i class="fas fa-map-marker-alt mr-2"></i>Location Verification
                                    </h5>
                                    <div class="text-sm text-gray-600 mb-2">
                                        Coordinates: ${report.latitude}, ${report.longitude}
                                    </div>
                                    <button onclick="showLocationOnMap(${report.latitude}, ${report.longitude})" 
                                            class="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                                        View on Map
                                    </button>
                                </div>
                            ` : ''}
                            
                            <!-- Verification Form -->
                            <div class="bg-white border-2 border-gray-200 p-4 rounded-lg">
                                <h5 class="font-semibold text-gray-900 mb-3">Verification Decision</h5>
                                <form id="verification-form" onsubmit="submitVerification(event, '${reportId}')">
                                    <div class="space-y-3">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Verification Status *</label>
                                            <select id="verification-status" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                                <option value="">Select verification status...</option>
                                                <option value="Verified">✓ Verified - Report is accurate</option>
                                                <option value="Needs Review">⚠ Needs Review - Requires additional information</option>
                                                <option value="Rejected">✗ Rejected - Report is inaccurate</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Verifier Name *</label>
                                            <input type="text" id="verifier-name" required 
                                                   value="${currentUser.full_name}" readonly
                                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Verification Notes</label>
                                            <textarea id="verification-notes" rows="3" 
                                                      placeholder="Add any verification notes or recommendations..." 
                                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
                                        </div>
                                        
                                        <div class="flex space-x-3">
                                            <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                                                Submit Verification
                                            </button>
                                            <button type="button" onclick="closeVerificationModal()" 
                                                    class="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }).catch(error => {
        console.error('Error loading report details:', error);
        showError('Failed to load report details for verification.');
    });
}

function closeVerificationModal() {
    const modal = document.getElementById('verification-modal');
    if (modal) {
        modal.remove();
    }
}

async function submitVerification(event, reportId) {
    event.preventDefault();
    
    const status = document.getElementById('verification-status').value;
    const verifierName = document.getElementById('verifier-name').value;
    const notes = document.getElementById('verification-notes').value;
    
    if (!status || !verifierName) {
        showError('Please fill in all required fields.');
        return;
    }
    
    try {
        showLoading();
        
        // Update the report with verification details
        await invasiveSpeciesAPI.verifyReport(reportId, verifierName, status, notes);
        
        showSuccess(`Report ${reportId.substring(0, 8)} has been ${status.toLowerCase()}!`);
        closeVerificationModal();
        
        // Refresh the recent reports to show updated status
        await loadRecentReports();
        
    } catch (error) {
        console.error('Error submitting verification:', error);
        showError('Failed to submit verification. Please try again.');
    } finally {
        hideLoading();
    }
}

function showLocationOnMap(lat, lon) {
    // Switch to map section and center on the location
    showSection('map');
    
    // Wait for map to load, then center on location
    setTimeout(() => {
        if (window.map) {
            window.map.setView([lat, lon], 15);
            
            // Add a temporary marker
            const marker = L.marker([lat, lon]).addTo(window.map);
            marker.bindPopup('Report Location').openPopup();
            
            // Remove marker after 10 seconds
            setTimeout(() => {
                window.map.removeLayer(marker);
            }, 10000);
        }
    }, 1000);
    
    closeVerificationModal();
}

// Reports Management Functions
async function loadReportsManagement() {
    try {
        // Load all reports
        const reports = await invasiveSpeciesAPI.getReports({ limit: 1000 });
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 100 });
        
        // Create species lookup
        const speciesMap = {};
        if (species.data) {
            species.data.forEach(s => {
                speciesMap[s.id] = s;
            });
        }
        
        // Update statistics
        updateReportsStatistics(reports.data || []);
        
        // Display reports in table
        displayReportsTable(reports.data || [], speciesMap);
        
        // Set up filter event listeners
        setupReportsFilters();
        
    } catch (error) {
        console.error('Error loading reports management:', error);
        showError('Failed to load reports management data');
    }
}

function updateReportsStatistics(reports) {
    const pending = reports.filter(r => r.verification_status === 'Pending').length;
    const verified = reports.filter(r => r.verification_status === 'Verified').length;
    const highPriority = reports.filter(r => 
        r.threat_assessment === 'High Risk' || 
        r.threat_assessment === 'Immediate Action Required'
    ).length;
    const nasaEnhanced = reports.filter(r => r.nasa_data || r.nasa_enhanced).length;
    
    document.getElementById('pending-reports-count').textContent = pending;
    document.getElementById('verified-reports-count').textContent = verified;
    document.getElementById('high-priority-count').textContent = highPriority;
    document.getElementById('nasa-enhanced-count').textContent = nasaEnhanced;
}

function displayReportsTable(reports, speciesMap) {
    const tbody = document.getElementById('reports-table-body');
    
    if (!reports || reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No reports found</td></tr>';
        return;
    }
    
    tbody.innerHTML = reports.map(report => {
        const species = speciesMap[report.species_id];
        const speciesName = species ? species.scientific_name : 'Unknown Species';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">#${report.id?.substring(0, 8) || 'Unknown'}</div>
                    ${report.nasa_enhanced ? '<div class="text-xs text-blue-600"><i class="fas fa-satellite mr-1"></i>NASA Enhanced</div>' : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${speciesName}</div>
                    <div class="text-xs text-gray-500">Confidence: ${report.confidence_level || 'Unknown'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${report.location_description || 'Not specified'}</div>
                    <div class="text-xs text-gray-500">${report.latitude || 'N/A'}, ${report.longitude || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${report.reporter_name || 'Anonymous'}</div>
                    <div class="text-xs text-gray-500">${report.reporter_type || 'Unknown'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${getThreatColorClass(report.threat_assessment)}">
                        ${report.threat_assessment || 'Unknown'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(report.verification_status)}">
                        ${report.verification_status || 'Pending'}
                    </span>
                    ${report.verified_by ? `<div class="text-xs text-gray-500 mt-1">by ${report.verified_by}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(report.report_date || report.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="showVerificationModal('${report.id}')" 
                                class="text-blue-600 hover:text-blue-900" title="Review/Verify">
                            <i class="fas fa-search"></i>
                        </button>
                        ${report.latitude && report.longitude ? `
                            <button onclick="showLocationOnMap(${report.latitude}, ${report.longitude})" 
                                    class="text-green-600 hover:text-green-900" title="View on Map">
                                <i class="fas fa-map-marker-alt"></i>
                            </button>
                        ` : ''}
                        <button onclick="exportSingleReport('${report.id}')" 
                                class="text-purple-600 hover:text-purple-900" title="Export Report">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupReportsFilters() {
    const searchInput = document.getElementById('reports-search');
    const verificationFilter = document.getElementById('verification-filter');
    const threatFilter = document.getElementById('threat-filter-reports');
    const dateFilter = document.getElementById('date-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterReports, 300));
    }
    
    if (verificationFilter) {
        verificationFilter.addEventListener('change', filterReports);
    }
    
    if (threatFilter) {
        threatFilter.addEventListener('change', filterReports);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterReports);
    }
}

async function filterReports() {
    try {
        // Get all reports and filters
        const reports = await invasiveSpeciesAPI.getReports({ limit: 1000 });
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 100 });
        
        const searchTerm = document.getElementById('reports-search')?.value.toLowerCase() || '';
        const verificationStatus = document.getElementById('verification-filter')?.value || '';
        const threatLevel = document.getElementById('threat-filter-reports')?.value || '';
        const dateRange = document.getElementById('date-filter')?.value || '';
        
        let filtered = reports.data || [];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(report => 
                report.id?.toLowerCase().includes(searchTerm) ||
                report.location_description?.toLowerCase().includes(searchTerm) ||
                report.reporter_name?.toLowerCase().includes(searchTerm) ||
                report.notes?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply verification status filter
        if (verificationStatus) {
            filtered = filtered.filter(report => report.verification_status === verificationStatus);
        }
        
        // Apply threat level filter
        if (threatLevel) {
            filtered = filtered.filter(report => report.threat_assessment === threatLevel);
        }
        
        // Apply date filter
        if (dateRange) {
            const now = new Date();
            let startDate;
            
            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    break;
            }
            
            if (startDate) {
                filtered = filtered.filter(report => {
                    const reportDate = new Date(report.report_date || report.created_at);
                    return reportDate >= startDate;
                });
            }
        }
        
        // Create species lookup
        const speciesMap = {};
        if (species.data) {
            species.data.forEach(s => {
                speciesMap[s.id] = s;
            });
        }
        
        // Update display
        updateReportsStatistics(filtered);
        displayReportsTable(filtered, speciesMap);
        
    } catch (error) {
        console.error('Error filtering reports:', error);
        showError('Failed to filter reports');
    }
}

function getThreatColorClass(threatLevel) {
    switch (threatLevel) {
        case 'Immediate Action Required':
            return 'bg-red-100 text-red-800';
        case 'High Risk':
            return 'bg-orange-100 text-orange-800';
        case 'Moderate Risk':
            return 'bg-yellow-100 text-yellow-800';
        case 'Low Risk':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

async function exportReports() {
    try {
        const reports = await invasiveSpeciesAPI.getReports({ limit: 1000 });
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 100 });
        
        // Create enhanced export data
        const exportData = {
            export_info: {
                exported_at: new Date().toISOString(),
                total_reports: reports.data?.length || 0,
                nasa_integration: true
            },
            reports: reports.data || [],
            species_lookup: species.data || []
        };
        
        // Create and download file
        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('Reports exported successfully!');
        
    } catch (error) {
        console.error('Error exporting reports:', error);
        showError('Failed to export reports');
    }
}

async function exportSingleReport(reportId) {
    try {
        const report = await invasiveSpeciesAPI.getReportById(reportId);
        
        const jsonData = JSON.stringify(report.data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${reportId.substring(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess(`Report #${reportId.substring(0, 8)} exported successfully!`);
        
    } catch (error) {
        console.error('Error exporting single report:', error);
        showError('Failed to export report');
    }
}