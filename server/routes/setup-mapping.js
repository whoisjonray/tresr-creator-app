const express = require('express');
const router = express.Router();

// Temporary setup endpoint for production
router.get('/setup-memelord', async (req, res) => {
  try {
    const { CreatorMapping, UserRole } = require('../models');
    
    if (!CreatorMapping) {
      return res.status(500).json({ error: 'CreatorMapping model not available' });
    }
    
    // Create the memelord mapping
    const memelordData = {
      sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com',
      sanityName: 'memelord',
      isVerified: true,
      metadata: {
        note: 'Production setup via API',
        createdAt: new Date().toISOString()
      }
    };
    
    const [mapping, created] = await CreatorMapping.findOrCreate({
      where: { sanityPersonId: memelordData.sanityPersonId },
      defaults: memelordData
    });
    
    let message = created ? 'Created new mapping' : 'Mapping already exists';
    
    if (!created) {
      // Update existing
      await mapping.update(memelordData);
      message = 'Updated existing mapping';
    }
    
    // Also ensure user role is admin
    if (UserRole) {
      const [userRole, roleCreated] = await UserRole.findOrCreate({
        where: { dynamicId: memelordData.dynamicId },
        defaults: {
          dynamicId: memelordData.dynamicId,
          email: memelordData.email,
          name: 'Jon Ray',
          role: 'admin'
        }
      });
      
      if (!roleCreated && userRole.role !== 'admin') {
        await userRole.update({ role: 'admin' });
        message += ' and set role to admin';
      }
    }
    
    res.json({
      success: true,
      message: message,
      mapping: {
        id: mapping.id,
        sanityPersonId: mapping.sanityPersonId,
        dynamicId: mapping.dynamicId,
        email: mapping.email,
        sanityName: mapping.sanityName
      }
    });
    
  } catch (error) {
    console.error('Setup failed:', error);
    res.status(500).json({ 
      error: 'Setup failed', 
      details: error.message 
    });
  }
});

// Check mapping status
router.get('/check-mapping/:dynamicId', async (req, res) => {
  try {
    const { CreatorMapping } = require('../models');
    const { dynamicId } = req.params;
    
    const mapping = await CreatorMapping.findOne({
      where: { dynamicId }
    });
    
    if (mapping) {
      res.json({
        exists: true,
        mapping: {
          sanityPersonId: mapping.sanityPersonId,
          email: mapping.email,
          sanityName: mapping.sanityName,
          lastSyncedAt: mapping.lastSyncedAt
        }
      });
    } else {
      res.json({
        exists: false,
        message: 'No mapping found for this Dynamic ID'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;