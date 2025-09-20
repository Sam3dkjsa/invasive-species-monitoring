# Invasive Plant Species Monitoring System (IPSMS)

A comprehensive web-based monitoring system for tracking and managing invasive plant species, enhanced with NASA satellite data integration.

## 🌟 Features

- **Interactive Species Database** - Comprehensive information about invasive plant species
- **Real-time Mapping** - Interactive map with species locations and monitoring sites
- **NASA Integration** - Enhanced with NASA Earth imagery and satellite data
- **Report Submission** - Citizen science reporting system
- **Analytics Dashboard** - Data visualization and trend analysis
- **Responsive Design** - Mobile-friendly interface

## 🛰️ NASA API Integration

This system integrates with NASA's Earth Observing System to provide:
- Satellite imagery for report verification
- Environmental monitoring data
- Climate zone analysis
- Enhanced species tracking with space-based observations

## 🚀 Quick Start

### Prerequisites
- Python 3.x installed on your system
- Modern web browser
- Internet connection for external dependencies

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/invasive-species-monitoring.git
   cd invasive-species-monitoring
   ```

2. **Start the local server**
   ```bash
   python -m http.server 8000
   ```

3. **Open your browser**
   Navigate to `http://localhost:8000`

### Testing Map Functionality
For debugging map issues, visit: `http://localhost:8000/test-map.html`

## 📁 Project Structure

```
invasive-species-monitoring/
├── index.html              # Main application
├── test-map.html           # Map testing page
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── main.js            # Main application logic
│   ├── api.js             # API integration & NASA data
│   ├── map.js             # Interactive mapping functionality
│   └── charts.js          # Analytics and charts
└── README.md              # This file
```

## 🔧 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet.js with MarkerCluster
- **Charts**: Chart.js
- **APIs**: NASA Earth Observing System APIs
- **Server**: Python HTTP Server (development)

## 🌍 External Dependencies

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Font Awesome](https://fontawesome.com/) - Icons
- [NASA APIs](https://api.nasa.gov/) - Earth imagery and environmental data

## 📊 Data Sources

The application uses mock data for demonstration purposes, enhanced with:
- NASA Earth Imagery API
- NASA Planetary API
- Environmental monitoring data
- Climate analysis systems

## 🔑 API Configuration

The system includes NASA API integration. To use your own NASA API key:

1. Sign up at [NASA Open Data Portal](https://api.nasa.gov/)
2. Get your API key
3. Update the key in `js/api.js`:
   ```javascript
   this.nasaApiKey = 'YOUR_NASA_API_KEY_HERE';
   ```

## 🎯 Usage

### Navigation
- **Dashboard** - Overview of system statistics and recent activity
- **Species Database** - Browse and search invasive species
- **Interactive Map** - View species locations and monitoring sites
- **Report Sighting** - Submit new species observations
- **Analytics** - View data trends and insights

### Reporting Species
1. Navigate to "Report Sighting"
2. Fill in species information
3. Use GPS or manual coordinates
4. Add population assessment
5. Submit for NASA satellite verification

### Map Features
- Color-coded threat level markers
- Species filtering
- NASA satellite imagery overlays
- Monitoring site locations
- Real-time data updates

## 🧪 Testing

### Manual Testing
- Use the test page: `http://localhost:8000/test-map.html`
- Check browser console for errors
- Verify all sections load properly

### Map Testing
The test page provides detailed diagnostics for:
- Leaflet library loading
- Map container initialization
- Data loading and markers
- NASA API integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Notes

- The system uses mock data when no backend is available
- NASA API integration provides enhanced environmental context
- All external dependencies are loaded via CDN
- Responsive design works on mobile and desktop

## 🐛 Troubleshooting

### Map Not Loading
1. Check browser console for errors
2. Verify internet connection for CDN resources
3. Use the test page for detailed diagnostics
4. Ensure JavaScript is enabled

### API Issues
- Mock data system provides fallback when APIs are unavailable
- NASA API rate limits may apply
- Check network connectivity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA for providing Earth observation APIs
- OpenStreetMap for map tiles
- The scientific community for invasive species research
- Contributors to open-source mapping and visualization libraries

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Use the built-in test page for diagnostics

---

**Built with 🌱 for environmental conservation and 🛰️ NASA technology**