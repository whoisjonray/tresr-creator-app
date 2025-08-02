const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

// Mock data for testing until NFC backend is deployed
const mockScanData = [
  {
    id: 1,
    tagId: 'TEST-001',
    userId: 'user-123',
    latitude: 40.7128,
    longitude: -74.0060,
    locationName: 'Times Square, NYC',
    locationAccuracy: 25,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    product: { id: 'prod-1', source: 'shopify' }
  },
  {
    id: 2,
    tagId: 'TEST-002',
    userId: 'user-456',
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: 'San Francisco, CA',
    locationAccuracy: 30,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    product: { id: 'prod-2', source: 'shopify' }
  },
  {
    id: 3,
    tagId: 'TEST-003',
    userId: 'user-789',
    latitude: 51.5074,
    longitude: -0.1278,
    locationName: 'London, UK',
    locationAccuracy: 15,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    product: { id: 'prod-3', source: 'shopify' }
  }
];

// Get scan history
router.get('/scan-history', async (req, res) => {
  try {
    const { tagId, userId, limit = 100, offset = 0 } = req.query;

    // For now, return mock data
    // TODO: Once NFC backend is deployed, proxy to actual endpoint
    let scans = [...mockScanData];
    
    // Filter by tagId if provided
    if (tagId) {
      scans = scans.filter(scan => scan.tagId === tagId);
    }
    
    // Filter by userId if provided
    if (userId) {
      scans = scans.filter(scan => scan.userId === userId);
    }
    
    // Apply pagination
    const paginatedScans = scans.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      scans: paginatedScans,
      total: scans.length
    });

    // Future implementation when NFC backend is ready:
    /*
    const nfcBackendUrl = process.env.NFC_BACKEND_URL || 'https://nfc.tresr.com';
    const response = await axios.get(`${nfcBackendUrl}/scan-history`, {
      params: { tagId, userId, limit, offset }
    });
    res.json(response.data);
    */
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scan history',
      message: error.message 
    });
  }
});

// Get scan locations for map visualization
router.get('/scan-locations', async (req, res) => {
  try {
    const { startDate, endDate, bounds } = req.query;

    // Return all scans with location data
    const scansWithLocation = mockScanData.filter(scan => 
      scan.latitude && scan.longitude
    );

    res.json({
      locations: scansWithLocation.map(scan => ({
        lat: scan.latitude,
        lng: scan.longitude,
        tagId: scan.tagId,
        locationName: scan.locationName,
        timestamp: scan.createdAt
      })),
      total: scansWithLocation.length
    });
  } catch (error) {
    console.error('Error fetching scan locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scan locations',
      message: error.message 
    });
  }
});

// Record a new scan with location (for testing)
router.post('/record-scan', requireAuth, async (req, res) => {
  try {
    const { tagId, location } = req.body;
    const userId = req.session.creator.id;

    // Create new scan record
    const newScan = {
      id: mockScanData.length + 1,
      tagId,
      userId,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationName: location?.locationName,
      locationAccuracy: location?.accuracy,
      createdAt: new Date().toISOString(),
      product: null
    };

    // Add to mock data
    mockScanData.push(newScan);

    res.json({
      success: true,
      scan: newScan
    });
  } catch (error) {
    console.error('Error recording scan:', error);
    res.status(500).json({ 
      error: 'Failed to record scan',
      message: error.message 
    });
  }
});

module.exports = router;