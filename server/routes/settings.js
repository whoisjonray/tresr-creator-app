const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Admin check middleware
const requireAdmin = (req, res, next) => {
  // Only allow whoisjonray@gmail.com for now
  if (req.session?.user?.email === 'whoisjonray@gmail.com') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
};

// Get current print areas (global settings)
router.get('/print-areas', async (req, res) => {
  try {
    // Try to load from database or config file
    const configPath = path.join(__dirname, '../config/printAreas.json');
    
    try {
      const data = await fs.readFile(configPath, 'utf8');
      const printAreas = JSON.parse(data);
      
      res.json({
        success: true,
        printAreas: printAreas
      });
    } catch (error) {
      // Return defaults if no saved config
      res.json({
        success: true,
        printAreas: null,
        message: 'Using default print areas'
      });
    }
  } catch (error) {
    console.error('Error loading print areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load print areas'
    });
  }
});

// Save print areas (admin only - affects ALL users)
router.post('/print-areas', requireAdmin, async (req, res) => {
  try {
    const { printAreas } = req.body;
    
    if (!printAreas) {
      return res.status(400).json({
        success: false,
        error: 'No print areas provided'
      });
    }
    
    // Create config directory if it doesn't exist
    const configDir = path.join(__dirname, '../config');
    await fs.mkdir(configDir, { recursive: true });
    
    // Save to config file (this affects ALL users globally)
    const configPath = path.join(configDir, 'printAreas.json');
    await fs.writeFile(configPath, JSON.stringify(printAreas, null, 2));
    
    // Also update the client-side config file if needed
    const clientConfigPath = path.join(__dirname, '../../client/src/config/printAreas.json');
    try {
      await fs.writeFile(clientConfigPath, JSON.stringify(printAreas, null, 2));
    } catch (clientError) {
      console.log('Could not update client config:', clientError.message);
    }
    
    console.log(`✅ Global print areas updated by ${req.session.user.email}`);
    console.log('Print areas:', printAreas);
    
    res.json({
      success: true,
      message: 'Print areas saved globally for all users',
      updatedBy: req.session.user.email,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error saving print areas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save print areas'
    });
  }
});

// Get all global settings
router.get('/global', async (req, res) => {
  try {
    const settings = {
      printAreas: null,
      dtgPlatenSize: { width: 14, height: 20, unit: 'inches' },
      canvasSize: { width: 600, height: 600 },
      defaultScale: 0.35
    };
    
    // Load print areas if saved
    try {
      const configPath = path.join(__dirname, '../config/printAreas.json');
      const data = await fs.readFile(configPath, 'utf8');
      settings.printAreas = JSON.parse(data);
    } catch (error) {
      // Use defaults
    }
    
    res.json({
      success: true,
      settings
    });
    
  } catch (error) {
    console.error('Error loading global settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load settings'
    });
  }
});

module.exports = router;