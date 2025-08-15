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

// Debug current session
router.get('/debug-session', async (req, res) => {
  try {
    const { CreatorMapping } = require('../models');
    
    // Show session info
    const sessionInfo = {
      hasSession: !!req.session,
      hasCreator: !!req.session?.creator,
      creator: req.session?.creator ? {
        id: req.session.creator.id,
        email: req.session.creator.email,
        name: req.session.creator.name,
        isAdmin: req.session.creator.isAdmin,
        role: req.session.creator.role
      } : null
    };
    
    // Check if mapping exists for this user
    let mapping = null;
    if (req.session?.creator?.id) {
      mapping = await CreatorMapping.findOne({
        where: { dynamicId: req.session.creator.id }
      });
      
      if (!mapping && req.session.creator.email) {
        // Try by email
        mapping = await CreatorMapping.findOne({
          where: { email: req.session.creator.email }
        });
      }
    }
    
    // Get all mappings
    const allMappings = await CreatorMapping.findAll();
    
    res.json({
      session: sessionInfo,
      mappingFound: !!mapping,
      mapping: mapping ? {
        id: mapping.id,
        sanityPersonId: mapping.sanityPersonId,
        dynamicId: mapping.dynamicId,
        email: mapping.email
      } : null,
      allMappings: allMappings.map(m => ({
        email: m.email,
        dynamicId: m.dynamicId,
        sanityPersonId: m.sanityPersonId
      })),
      suggestion: !mapping && req.session?.creator ? 
        `No mapping found for Dynamic ID: ${req.session.creator.id}. The expected ID is: 31162d55-0da5-4b13-ad7c-3cafd170cebf` : 
        null
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug failed', 
      details: error.message 
    });
  }
});

// Update mapping to current session
router.get('/update-my-mapping', async (req, res) => {
  try {
    const { CreatorMapping } = require('../models');
    
    if (!req.session?.creator) {
      return res.status(401).json({ 
        error: 'Not logged in',
        hint: 'Please log in first' 
      });
    }
    
    const currentDynamicId = req.session.creator.id;
    const currentEmail = req.session.creator.email;
    
    // Find existing mapping by email
    let mapping = await CreatorMapping.findOne({
      where: { email: currentEmail }
    });
    
    if (mapping) {
      // Update the Dynamic ID
      const oldId = mapping.dynamicId;
      await mapping.update({ dynamicId: currentDynamicId });
      
      res.json({
        success: true,
        message: 'Updated mapping with your current Dynamic ID',
        oldDynamicId: oldId,
        newDynamicId: currentDynamicId,
        email: currentEmail
      });
    } else {
      // Create new mapping for current user
      mapping = await CreatorMapping.create({
        sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e', // memelord
        dynamicId: currentDynamicId,
        email: currentEmail,
        sanityName: 'memelord',
        isVerified: true,
        metadata: {
          note: 'Created from current session',
          createdAt: new Date().toISOString()
        }
      });
      
      res.json({
        success: true,
        message: 'Created new mapping for your account',
        mapping: {
          dynamicId: mapping.dynamicId,
          email: mapping.email,
          sanityPersonId: mapping.sanityPersonId
        }
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Update failed', 
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