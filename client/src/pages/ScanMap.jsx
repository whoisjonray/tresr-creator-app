import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import './ScanMap.css';

// Simple map component using Google Maps
const ScanMap = () => {
  const { creator } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    fetchScanHistory();
    loadGoogleMaps();
  }, []);

  const fetchScanHistory = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://vibes.tresr.com'
        : 'http://localhost:3002';
      
      const response = await axios.get(`${apiUrl}/api/scan-history`, {
        params: { limit: 1000 }
      });
      
      setScans(response.data.scans || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      setLoading(false);
    }
  };

  const loadGoogleMaps = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // For now, we'll use a simple canvas-based map
    // In production, you'd add Google Maps API key
    setTimeout(() => initializeSimpleMap(), 100);
  };

  const initializeSimpleMap = () => {
    const container = document.getElementById('scan-map');
    if (!container) return;

    // Create a simple visualization for now
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth;
    canvas.height = 500;
    canvas.style.border = '1px solid #ddd';
    canvas.style.borderRadius = '8px';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw scan points
    scans.forEach(scan => {
      if (scan.latitude && scan.longitude) {
        // Simple projection (would use proper map projection in production)
        const x = ((scan.longitude + 180) / 360) * canvas.width;
        const y = ((90 - scan.latitude) / 180) * canvas.height;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#4A90E2';
        ctx.fill();
        
        // Draw glow effect
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 144, 226, 0.3)';
        ctx.fill();
      }
    });

    // Add click handler
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Find nearest scan
      let nearestScan = null;
      let minDistance = Infinity;
      
      scans.forEach(scan => {
        if (scan.latitude && scan.longitude) {
          const scanX = ((scan.longitude + 180) / 360) * canvas.width;
          const scanY = ((90 - scan.latitude) / 180) * canvas.height;
          const distance = Math.sqrt((x - scanX) ** 2 + (y - scanY) ** 2);
          
          if (distance < 20 && distance < minDistance) {
            minDistance = distance;
            nearestScan = scan;
          }
        }
      });
      
      if (nearestScan) {
        setSelectedScan(nearestScan);
      }
    });
  };

  const initializeMap = () => {
    const map = new window.google.maps.Map(document.getElementById('scan-map'), {
      center: { lat: 40.7128, lng: -74.0060 }, // NYC default
      zoom: 10,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }]
        }
      ]
    });

    // Add markers for each scan
    scans.forEach(scan => {
      if (scan.latitude && scan.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: scan.latitude, lng: scan.longitude },
          map: map,
          title: scan.locationName || 'NFC Scan',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4A90E2',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          setSelectedScan(scan);
        });
      }
    });

    // Center map on scans
    if (scans.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      scans.forEach(scan => {
        if (scan.latitude && scan.longitude) {
          bounds.extend({ lat: scan.latitude, lng: scan.longitude });
        }
      });
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="scan-map-container">
      <div className="scan-map-header">
        <h1>NFC Scan Locations</h1>
        <p>See where your chips are being scanned around the world</p>
      </div>

      <div className="scan-stats">
        <div className="stat-card">
          <h3>{scans.length}</h3>
          <p>Total Scans</p>
        </div>
        <div className="stat-card">
          <h3>{scans.filter(s => s.latitude && s.longitude).length}</h3>
          <p>With Location</p>
        </div>
        <div className="stat-card">
          <h3>{new Set(scans.map(s => s.tagId)).size}</h3>
          <p>Unique Chips</p>
        </div>
      </div>

      <div className="map-container">
        {loading ? (
          <div className="loading-state">Loading scan data...</div>
        ) : (
          <>
            <div id="scan-map" style={{ width: '100%', height: '500px' }}></div>
            
            {selectedScan && (
              <div className="scan-details">
                <h3>Scan Details</h3>
                <button className="close-btn" onClick={() => setSelectedScan(null)}>×</button>
                <p><strong>Tag ID:</strong> {selectedScan.tagId}</p>
                <p><strong>Location:</strong> {selectedScan.locationName || 'Unknown'}</p>
                <p><strong>Coordinates:</strong> {selectedScan.latitude?.toFixed(4)}, {selectedScan.longitude?.toFixed(4)}</p>
                <p><strong>Accuracy:</strong> {selectedScan.locationAccuracy || 'N/A'}m</p>
                <p><strong>Time:</strong> {new Date(selectedScan.createdAt).toLocaleString()}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="location-prompt">
        <div className="info-card">
          <h3>🎯 Testing Location Capture</h3>
          <p>To test location capture with your NFC chips:</p>
          <ol>
            <li>Enable location services on your phone</li>
            <li>Scan your test NFC chip</li>
            <li>The scan URL will automatically include location data</li>
            <li>Refresh this page to see your scan appear on the map!</li>
          </ol>
          <p className="test-url">
            Test URL format: <code>/nfc/seritag?x=XXX&n=XXX&e=XXX&lat=40.7128&lng=-74.0060</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScanMap;