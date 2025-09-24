// Map functionality for Invasive Plant Species Monitoring System

let map = null;
let markers = [];
let markerClusters = null;

// Wait for Leaflet to be loaded
function waitForLeaflet() {
    return new Promise((resolve, reject) => {
        if (typeof L !== 'undefined') {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        const checkLeaflet = setInterval(() => {
            attempts++;
            
            if (typeof L !== 'undefined') {
                clearInterval(checkLeaflet);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkLeaflet);
                reject(new Error('Leaflet library failed to load'));
            }
        }, 100);
    });
}

// Initialize map when map section is loaded
async function loadMapData() {
    try {
        console.log('Starting map data loading...');
        updateMapStatus('Loading map library...', 'info');
        
        // Wait for Leaflet to be loaded
        await waitForLeaflet();
        
        updateMapStatus('Initializing map...', 'info');
        
        // Check if map container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            updateMapStatus('Map container not found', 'error');
            showError('Map container not found.');
            return;
        }
        
        // Initialize map if not already done
        if (!map) {
            await initializeMap();
        }
        
        updateMapStatus('Loading map data...', 'info');
        
        // Load and display data on map
        await loadMapMarkers();
        
        updateMapStatus('Map loaded successfully!', 'success');
        
        // Hide status after 3 seconds
        setTimeout(() => {
            hideMapStatus();
        }, 3000);
        
        console.log('Map data loaded successfully');
        
    } catch (error) {
        console.error('Error loading map data:', error);
        updateMapStatus('Failed to load map: ' + error.message, 'error');
        showError('Failed to load map data: ' + error.message);
    }
}

// Initialize Leaflet map
async function initializeMap() {
    try {
        console.log('Initializing map...');
        
        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            throw new Error('Leaflet library not loaded');
        }
        
        // Get map container
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            throw new Error('Map container element not found');
        }
        
        // Clear any existing map instance
        if (map) {
            map.remove();
            map = null;
        }
        
        // Initialize map centered on a default location (can be changed)
        map = L.map('map', {
            center: [39.8283, -98.5795], // Centered on US
            zoom: 4,
            zoomControl: true,
            attributionControl: true
        });
        
        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
        
        tileLayer.on('tileerror', function(error) {
            console.warn('Tile loading error:', error);
        });
        
        tileLayer.addTo(map);
        
        // Add map controls
        setupMapControls();
        
        // Wait a bit for map to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Invalidate size to ensure proper rendering
        map.invalidateSize();
        
        console.log('Map initialized successfully');
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showError('Failed to initialize map: ' + error.message);
        throw error;
    }
}

// Set up map controls and event listeners
function setupMapControls() {
    try {
        // Add event listeners for map control checkboxes
        const showSightings = document.getElementById('show-sightings');
        const showMonitoring = document.getElementById('show-monitoring');
        const showNasaData = document.getElementById('show-nasa-data');
        const speciesFilter = document.getElementById('map-species-filter');
        
        if (showSightings) {
            showSightings.addEventListener('change', updateMapDisplay);
        } else {
            console.warn('show-sightings checkbox not found');
        }
        
        if (showMonitoring) {
            showMonitoring.addEventListener('change', updateMapDisplay);
        } else {
            console.warn('show-monitoring checkbox not found');
        }
        
        if (showNasaData) {
            showNasaData.addEventListener('change', updateMapDisplay);
        } else {
            console.warn('show-nasa-data checkbox not found');
        }
        
        if (speciesFilter) {
            speciesFilter.addEventListener('change', updateMapDisplay);
        } else {
            console.warn('map-species-filter select not found');
        }
        
        console.log('Map controls set up successfully');
        
    } catch (error) {
        console.error('Error setting up map controls:', error);
    }
}

// Load markers on the map
async function loadMapMarkers() {
    try {
        console.log('Loading map markers...');
        
        // Verify map exists
        if (!map) {
            throw new Error('Map not initialized');
        }
        
        // Clear existing markers
        clearMapMarkers();
        
        // Load sighting reports
        console.log('Fetching reports data...');
        const reports = await invasiveSpeciesAPI.getReports({ limit: 500 });
        
        console.log('Fetching species data...');
        const species = await invasiveSpeciesAPI.getSpecies({ limit: 100 });
        
        console.log('Fetching monitoring locations...');
        const locations = await invasiveSpeciesAPI.getMonitoringLocations({ limit: 100 });
        
        // Create species lookup map
        const speciesMap = {};
        if (species.data) {
            species.data.forEach(s => {
                speciesMap[s.id] = s;
            });
            // Store species data globally for popup functions
            window.speciesData = species.data;
        }
        
        // Populate species filter dropdown
        populateSpeciesFilter(species.data || []);
        
        // Add sighting markers
        if (reports.data && reports.data.length > 0) {
            console.log(`Adding ${reports.data.length} sighting markers...`);
            addSightingMarkers(reports.data, speciesMap);
        } else {
            console.log('No reports data available');
        }
        
        // Add monitoring location markers
        if (locations.data && locations.data.length > 0) {
            console.log(`Adding ${locations.data.length} monitoring markers...`);
            addMonitoringMarkers(locations.data);
        } else {
            console.log('No monitoring locations data available');
        }
        
        // Load and add NASA invasive plants data
        console.log('Loading NASA invasive plants data...');
        const nasaInvasiveData = await loadNasaInvasivePlantsData();
        if (nasaInvasiveData && nasaInvasiveData.length > 0) {
            console.log(`Adding ${nasaInvasiveData.length} NASA invasive plants markers...`);
            addNasaInvasivePlantsMarkers(nasaInvasiveData);
        } else {
            console.log('No NASA invasive plants data available');
        }
        
        // Initialize marker clustering if available
        if (typeof L.markerClusterGroup === 'function' && markers.length > 0) {
            console.log('Initializing marker clustering...');
            markerClusters = L.markerClusterGroup();
            markers.forEach(marker => markerClusters.addLayer(marker));
            map.addLayer(markerClusters);
        } else if (markers.length > 0) {
            console.log('Adding markers without clustering...');
            markers.forEach(marker => marker.addTo(map));
        }
        
        console.log(`Map markers loaded successfully. Total markers: ${markers.length}`);
        
    } catch (error) {
        console.error('Error loading map markers:', error);
        showError('Failed to load map markers: ' + error.message);
    }
}

// Add sighting report markers
function addSightingMarkers(reports, speciesMap) {
    reports.forEach(report => {
        if (report.latitude && report.longitude) {
            const species = speciesMap[report.species_id];
            const color = getThreatMarkerColor(report.threat_assessment || species?.threat_level);
            
            const marker = L.circleMarker([report.latitude, report.longitude], {
                radius: 8,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });
            
            // Create popup content
            const popupContent = createSightingPopup(report, species);
            marker.bindPopup(popupContent);
            
            // Store metadata for filtering
            marker.reportData = report;
            marker.speciesData = species;
            marker.markerType = 'sighting';
            
            markers.push(marker);
        }
    });
}

// Add monitoring location markers
function addMonitoringMarkers(locations) {
    locations.forEach(location => {
        if (location.latitude && location.longitude) {
            const marker = L.marker([location.latitude, location.longitude], {
                icon: L.divIcon({
                    className: 'monitoring-marker',
                    html: '<i class="fas fa-eye" style="color: #3b82f6; font-size: 16px;"></i>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            });
            
            // Create popup content
            const popupContent = createMonitoringPopup(location);
            marker.bindPopup(popupContent);
            
            // Store metadata for filtering
            marker.locationData = location;
            marker.markerType = 'monitoring';
            
            markers.push(marker);
        }
    });
}

// Create popup content for sighting markers
function createSightingPopup(report, species) {
    const speciesName = species ? species.scientific_name : 'Unknown Species';
    const threatLevel = report.threat_assessment || species?.threat_level || 'Unknown';
    const reportDate = formatDate(report.report_date || report.created_at);
    const hasNasaData = report.nasa_data && report.nasa_data.earth_imagery;
    const speciesImage = species?.image_url || `https://picsum.photos/300/200?random=${species?.id || 'default'}`;
    
    return `
        <div class="popup-content">
            ${species ? `
                <div class="mb-3">
                    <img src="${speciesImage}" 
                         alt="${speciesName}" 
                         class="w-full h-32 object-cover rounded-lg"
                         onerror="handleImageError(this, ${JSON.stringify(species?.backup_image_urls || [])})">
                    <div class="hidden w-full h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-seedling text-white text-2xl"></i>
                    </div>
                </div>
            ` : ''}
            <h4 class="font-semibold text-gray-900 mb-2">${speciesName}</h4>
            ${hasNasaData ? '<div class="mb-2 text-xs text-blue-600"><i class="fas fa-satellite mr-1"></i>NASA Enhanced Data</div>' : ''}
            <div class="space-y-1 text-sm">
                <p><strong>Threat Level:</strong> <span class="px-2 py-1 rounded text-xs ${getThreatColorClass(threatLevel)}">${threatLevel}</span></p>
                <p><strong>Population:</strong> ${report.population_size || 'Unknown'}</p>
                <p><strong>Confidence:</strong> ${report.confidence_level || 'Unknown'}</p>
                <p><strong>Reported:</strong> ${reportDate}</p>
                <p><strong>Reporter:</strong> ${report.reporter_name || 'Anonymous'}</p>
                ${report.location_description ? `<p><strong>Location:</strong> ${report.location_description}</p>` : ''}
                ${hasNasaData ? `
                    <div class="mt-2 p-2 bg-blue-50 rounded">
                        <p class="text-xs font-semibold text-blue-800">NASA Satellite Data:</p>
                        <p class="text-xs text-blue-600">Earth imagery available</p>
                        <p class="text-xs text-blue-600">Environmental monitoring: Active</p>
                        ${report.satellite_confirmed ? '<p class="text-xs text-green-600">✓ Satellite confirmed</p>' : ''}
                    </div>
                ` : ''}
                ${report.notes ? `<p><strong>Notes:</strong> ${report.notes.substring(0, 100)}${report.notes.length > 100 ? '...' : ''}</p>` : ''}
            </div>
            ${hasNasaData && report.nasa_data.earth_imagery.url ? `
                <button onclick="viewNasaImagery('${report.nasa_data.earth_imagery.url}')" class="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    <i class="fas fa-satellite mr-1"></i>View NASA Imagery
                </button>
            ` : ''}
        </div>
    `;
}

// Create popup content for monitoring markers
function createMonitoringPopup(location) {
    return `
        <div class="popup-content">
            <h4 class="font-semibold text-gray-900 mb-2">Monitoring Site</h4>
            <div class="space-y-1 text-sm">
                <p><strong>Name:</strong> ${location.location_name || 'Unnamed Site'}</p>
                <p><strong>Type:</strong> ${location.location_type || 'Unknown'}</p>
                <p><strong>Status:</strong> ${location.monitoring_status || 'Unknown'}</p>
                ${location.description ? `<p><strong>Description:</strong> ${location.description}</p>` : ''}
                ${location.access_instructions ? `<p><strong>Access:</strong> ${location.access_instructions}</p>` : ''}
            </div>
        </div>
    `;
}

// Populate species filter dropdown
function populateSpeciesFilter(species) {
    const filterSelect = document.getElementById('map-species-filter');
    if (filterSelect && species) {
        const options = ['<option value="">All Species</option>'];
        species.forEach(s => {
            options.push(`<option value="${s.id}">${s.scientific_name}</option>`);
        });
        filterSelect.innerHTML = options.join('');
    }
}

// Update map display based on filters
function updateMapDisplay() {
    const showSightings = document.getElementById('show-sightings')?.checked !== false;
    const showMonitoring = document.getElementById('show-monitoring')?.checked !== false;
    const showNasaData = document.getElementById('show-nasa-data')?.checked !== false;
    const selectedSpecies = document.getElementById('map-species-filter')?.value || '';
    
    // Clear current display
    if (markerClusters) {
        map.removeLayer(markerClusters);
        markerClusters.clearLayers();
    } else {
        markers.forEach(marker => map.removeLayer(marker));
    }
    
    // Filter and add markers based on controls
    const filteredMarkers = markers.filter(marker => {
        // Filter by marker type
        if (marker.markerType === 'sighting' && !showSightings) return false;
        if (marker.markerType === 'monitoring' && !showMonitoring) return false;
        if (marker.markerType === 'nasa_invasive' && !showNasaData) return false;
        
        // Filter by species
        if (selectedSpecies && marker.reportData && marker.reportData.species_id !== selectedSpecies) {
            return false;
        }
        
        return true;
    });
    
    // Add filtered markers to map
    if (markerClusters) {
        filteredMarkers.forEach(marker => markerClusters.addLayer(marker));
        map.addLayer(markerClusters);
    } else {
        filteredMarkers.forEach(marker => marker.addTo(map));
    }
}

// Clear all markers from map
function clearMapMarkers() {
    if (markerClusters) {
        map.removeLayer(markerClusters);
        markerClusters.clearLayers();
    } else {
        markers.forEach(marker => map.removeLayer(marker));
    }
    markers = [];
}

// Get marker color based on threat level
function getThreatMarkerColor(threatLevel) {
    switch (threatLevel) {
        case 'Severe':
        case 'Immediate Action Required':
            return '#dc2626'; // Red
        case 'High':
        case 'High Risk':
            return '#ea580c'; // Orange
        case 'Moderate':
        case 'Moderate Risk':
            return '#ca8a04'; // Yellow
        case 'Low':
        case 'Low Risk':
            return '#16a34a'; // Green
        default:
            return '#6b7280'; // Gray
    }
}

// Get CSS classes for threat level badges
function getThreatColorClass(threatLevel) {
    switch (threatLevel) {
        case 'Severe':
        case 'Immediate Action Required':
            return 'bg-red-100 text-red-800';
        case 'High':
        case 'High Risk':
            return 'bg-orange-100 text-orange-800';
        case 'Moderate':
        case 'Moderate Risk':
            return 'bg-yellow-100 text-yellow-800';
        case 'Low':
        case 'Low Risk':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Resize map when container changes
function resizeMap() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// Export map functionality for external use
window.mapFunctions = {
    loadMapData,
    resizeMap,
    updateMapDisplay
};

// View NASA satellite imagery
function viewNasaImagery(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-4xl w-full max-h-full overflow-auto">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900">
                    <i class="fas fa-satellite mr-2 text-blue-600"></i>NASA Earth Imagery
                </h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-4 text-center">
                <img src="${imageUrl}" alt="NASA Earth Imagery" class="max-w-full h-auto rounded-lg mx-auto" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display:none;" class="text-gray-500 py-8">
                    <i class="fas fa-satellite text-4xl mb-4"></i>
                    <p>NASA satellite imagery loading...</p>
                    <p class="text-sm mt-2">Image URL: ${imageUrl}</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Make the function globally available
window.viewNasaImagery = viewNasaImagery;

// Load NASA invasive plants data for map display
async function loadNasaInvasivePlantsData() {
    try {
        console.log('Loading NASA invasive plants data...');
        
        // Get NASA environmental data for multiple regions
        const invasivePlantsLocations = await invasiveSpeciesAPI.getNasaInvasivePlantsLocations();
        
        console.log(`NASA invasive plants data loaded: ${invasivePlantsLocations.length} locations`);
        return invasivePlantsLocations;
        
    } catch (error) {
        console.error('Error loading NASA invasive plants data:', error);
        return [];
    }
}

// Add NASA invasive plants markers to the map
function addNasaInvasivePlantsMarkers(nasaData) {
    nasaData.forEach(location => {
        if (location.latitude && location.longitude) {
            // Create distinctive NASA marker
            const marker = L.marker([location.latitude, location.longitude], {
                icon: L.divIcon({
                    className: 'nasa-invasive-marker',
                    html: '<div style="background: linear-gradient(45deg, #1e40af, #3b82f6); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="fas fa-satellite" style="font-size: 10px;"></i></div>',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            });
            
            // Create comprehensive NASA popup
            const popupContent = createNasaInvasivePopup(location);
            marker.bindPopup(popupContent, { maxWidth: 400 });
            
            // Store metadata for filtering
            marker.nasaData = location;
            marker.markerType = 'nasa_invasive';
            
            markers.push(marker);
        }
    });
}

// Create popup content for NASA invasive species markers
function createNasaInvasivePopup(location) {
    // Try to find matching species from our database by scientific name
    let speciesImage = `https://picsum.photos/300/200?random=${location.id}`;
    let matchingSpecies = null;
    
    // If we have species data available, use the real image
    if (window.speciesData) {
        matchingSpecies = window.speciesData.find(s => 
            s.scientific_name === location.scientific_name ||
            s.common_name === location.species_name
        );
        if (matchingSpecies && matchingSpecies.image_url) {
            speciesImage = matchingSpecies.image_url;
        }
    }
    
    return `
        <div class="popup-content nasa-popup">
            <div class="bg-blue-50 px-3 py-2 rounded-t-lg border-b border-blue-200">
                <h4 class="font-semibold text-blue-900 flex items-center">
                    <i class="fas fa-satellite mr-2"></i>
                    NASA Detected Invasive Species
                </h4>
            </div>
            
            <div class="p-3 space-y-3">
                <!-- Species Image -->
                <div class="mb-3">
                    <img src="${speciesImage}" 
                         alt="${location.species_name}" 
                         class="w-full h-32 object-cover rounded-lg"
                         onerror="handleImageError(this, ${JSON.stringify(matchingSpecies?.backup_image_urls || [])})">
                    <div class="hidden w-full h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-satellite text-white text-2xl"></i>
                    </div>
                </div>
                
                <div>
                    <h5 class="font-semibold text-gray-900">${location.species_name || location.scientific_name}</h5>
                    <p class="text-sm text-gray-600 italic">${location.scientific_name}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <strong>Threat Level:</strong><br>
                        <span class="px-2 py-1 rounded text-xs ${getThreatColorClass(location.threat_level)}">
                            ${location.threat_level}
                        </span>
                    </div>
                    <div>
                        <strong>Coverage:</strong><br>
                        <span class="text-gray-700">${location.coverage_area || 'Unknown'}</span>
                    </div>
                </div>
                
                <div class="text-sm space-y-1">
                    <p><strong>Data Source:</strong> NASA Earth Observing System</p>
                    <p><strong>Detection Method:</strong> ${location.detection_method}</p>
                    <p><strong>Confidence:</strong> ${location.confidence}</p>
                    <p><strong>Last Detected:</strong> ${formatDate(location.last_detected)}</p>
                    ${location.growth_rate ? `<p><strong>Growth Pattern:</strong> ${location.growth_rate}</p>` : ''}
                    ${location.environmental_impact ? `<p><strong>Environmental Impact:</strong> ${location.environmental_impact}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Map status functions
function updateMapStatus(message, type = 'info') {
    const statusElement = document.getElementById('map-status');
    const statusText = document.getElementById('map-status-text');
    
    if (statusElement && statusText) {
        statusText.textContent = message;
        
        // Remove existing classes
        statusElement.className = statusElement.className.replace(/bg-\w+-\d+|text-\w+-\d+/g, '');
        
        // Add appropriate classes based on type
        switch (type) {
            case 'success':
                statusElement.className += ' bg-green-50 text-green-700';
                break;
            case 'error':
                statusElement.className += ' bg-red-50 text-red-700';
                break;
            case 'warning':
                statusElement.className += ' bg-yellow-50 text-yellow-700';
                break;
            default: // info
                statusElement.className += ' bg-blue-50 text-blue-700';
        }
        
        statusElement.classList.remove('hidden');
    }
}

function hideMapStatus() {
    const statusElement = document.getElementById('map-status');
    if (statusElement) {
        statusElement.classList.add('hidden');
    }
}