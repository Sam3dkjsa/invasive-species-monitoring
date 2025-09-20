// Charts and analytics functionality for Invasive Plant Species Monitoring System

let charts = {};

// Load analytics data and initialize charts
async function loadAnalyticsData() {
    try {
        showLoading();
        
        // Get analytics data from API with NASA integration
        const stats = await invasiveSpeciesAPI.getSpeciesStats();
        
        // Show NASA integration status
        if (stats.nasa_integration && stats.nasa_integration.enabled) {
            console.log('NASA satellite analytics integration active');
        }
        
        // Initialize all charts
        await Promise.all([
            initializeThreatDistributionChart(stats.species),
            initializeMonthlyReportsChart(stats.reports),
            initializeHabitatDistributionChart(stats.reports),
            initializeVerificationStatusChart(stats.reports)
        ]);
        
        console.log('Analytics charts initialized successfully with NASA integration');
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Failed to load analytics data');
    } finally {
        hideLoading();
    }
}

// Initialize threat level distribution chart
async function initializeThreatDistributionChart(species) {
    const ctx = document.getElementById('threat-distribution-chart');
    if (!ctx) return;
    
    try {
        // Destroy existing chart if it exists
        if (charts.threatDistribution) {
            charts.threatDistribution.destroy();
        }
        
        const distribution = invasiveSpeciesAPI.getThreatLevelDistribution(species || []);
        
        const data = {
            labels: Object.keys(distribution),
            datasets: [{
                label: 'Number of Species',
                data: Object.values(distribution),
                backgroundColor: [
                    '#dc2626', // Red for Severe
                    '#ea580c', // Orange for High
                    '#ca8a04', // Yellow for Moderate
                    '#16a34a', // Green for Low
                    '#6b7280'  // Gray for Unknown
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        };
        
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        };
        
        charts.threatDistribution = new Chart(ctx, config);
        
    } catch (error) {
        console.error('Error creating threat distribution chart:', error);
    }
}

// Initialize monthly reports trend chart
async function initializeMonthlyReportsChart(reports) {
    const ctx = document.getElementById('monthly-reports-chart');
    if (!ctx) return;
    
    try {
        // Destroy existing chart if it exists
        if (charts.monthlyReports) {
            charts.monthlyReports.destroy();
        }
        
        const monthlyData = invasiveSpeciesAPI.getMonthlyReports(reports || []);
        
        // Convert to arrays for Chart.js
        const labels = Object.keys(monthlyData).map(key => {
            const date = new Date(key + '-01');
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });
        const values = Object.values(monthlyData);
        
        const data = {
            labels: labels,
            datasets: [{
                label: 'Reports Submitted',
                data: values,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#059669',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Number of Reports'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };
        
        charts.monthlyReports = new Chart(ctx, config);
        
    } catch (error) {
        console.error('Error creating monthly reports chart:', error);
    }
}

// Initialize habitat distribution chart
async function initializeHabitatDistributionChart(reports) {
    const ctx = document.getElementById('habitat-distribution-chart');
    if (!ctx) return;
    
    try {
        // Destroy existing chart if it exists
        if (charts.habitatDistribution) {
            charts.habitatDistribution.destroy();
        }
        
        const distribution = invasiveSpeciesAPI.getHabitatDistribution(reports || []);
        
        const data = {
            labels: Object.keys(distribution),
            datasets: [{
                label: 'Number of Reports',
                data: Object.values(distribution),
                backgroundColor: [
                    '#10b981', // Forest - Green
                    '#3b82f6', // Wetland - Blue
                    '#f59e0b', // Grassland - Amber
                    '#06b6d4', // Coastal - Cyan
                    '#8b5cf6', // Riparian - Purple
                    '#ef4444', // Urban - Red
                    '#84cc16', // Agricultural - Lime
                    '#6b7280'  // Other - Gray
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Habitat Type'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Number of Reports'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };
        
        charts.habitatDistribution = new Chart(ctx, config);
        
    } catch (error) {
        console.error('Error creating habitat distribution chart:', error);
    }
}

// Initialize verification status chart
async function initializeVerificationStatusChart(reports) {
    const ctx = document.getElementById('verification-status-chart');
    if (!ctx) return;
    
    try {
        // Destroy existing chart if it exists
        if (charts.verificationStatus) {
            charts.verificationStatus.destroy();
        }
        
        const distribution = invasiveSpeciesAPI.getVerificationDistribution(reports || []);
        
        const data = {
            labels: Object.keys(distribution),
            datasets: [{
                label: 'Number of Reports',
                data: Object.values(distribution),
                backgroundColor: [
                    '#10b981', // Verified - Green
                    '#f59e0b', // Pending - Amber
                    '#ef4444', // Rejected - Red
                    '#6b7280'  // Unknown - Gray
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        };
        
        const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        };
        
        charts.verificationStatus = new Chart(ctx, config);
        
    } catch (error) {
        console.error('Error creating verification status chart:', error);
    }
}

// Export data functionality
async function exportData(dataType) {
    try {
        showLoading();
        
        let data;
        let filename;
        
        switch (dataType) {
            case 'species':
                const species = await invasiveSpeciesAPI.getSpecies({ limit: 1000 });
                data = species.data || [];
                filename = 'invasive_species_data.json';
                break;
                
            case 'reports':
                const reports = await invasiveSpeciesAPI.getReports({ limit: 1000 });
                data = reports.data || [];
                filename = 'sighting_reports_data.json';
                break;
                
            case 'analytics':
                const stats = await invasiveSpeciesAPI.getSpeciesStats();
                data = {
                    summary: {
                        totalSpecies: stats.totalSpecies,
                        totalReports: stats.totalReports,
                        activeReports: stats.activeReports,
                        monitoringSites: stats.monitoringSites,
                        contributors: stats.contributors
                    },
                    threatDistribution: invasiveSpeciesAPI.getThreatLevelDistribution(stats.species),
                    habitatDistribution: invasiveSpeciesAPI.getHabitatDistribution(stats.reports),
                    monthlyReports: invasiveSpeciesAPI.getMonthlyReports(stats.reports),
                    verificationDistribution: invasiveSpeciesAPI.getVerificationDistribution(stats.reports),
                    exportDate: new Date().toISOString()
                };
                filename = 'analytics_summary.json';
                break;
                
            default:
                throw new Error('Unknown data type');
        }
        
        // Create and download file
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess(`${dataType} data exported successfully!`);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showError(`Failed to export ${dataType} data`);
    } finally {
        hideLoading();
    }
}

// Refresh all charts
async function refreshCharts() {
    if (currentSection === 'analytics') {
        await loadAnalyticsData();
    }
}

// Destroy all charts (useful for cleanup)
function destroyAllCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
}

// Resize charts when container changes
function resizeCharts() {
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
}

// Handle window resize for charts
window.addEventListener('resize', debounce(() => {
    resizeCharts();
}, 250));

// Export functions for external use
window.chartFunctions = {
    loadAnalyticsData,
    refreshCharts,
    destroyAllCharts,
    resizeCharts,
    exportData
};