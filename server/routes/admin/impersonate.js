const express = require('express');
const router = express.Router();
const { UserRole } = require('../../models');
const { requireAdmin } = require('../../middleware/auth');

// Start impersonating a user
router.post('/start/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the target user
    const targetUser = await UserRole.findOne({
      where: { dynamicId: userId }
    });
    
    if (!targetUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Don't allow impersonating other admins
    if (targetUser.role === 'admin') {
      return res.status(403).json({ 
        error: 'Cannot impersonate admin users' 
      });
    }
    
    // Store original admin session
    req.session.impersonation = {
      originalCreator: { ...req.session.creator },
      targetId: targetUser.dynamicId,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      startedAt: new Date()
    };
    
    // Update session to impersonate target user
    req.session.creator = {
      id: targetUser.dynamicId,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      isCreator: true,
      isAdmin: false,
      isImpersonating: true
    };
    
    // Log impersonation in database
    await targetUser.update({
      lastImpersonatedAt: new Date(),
      lastImpersonatedBy: req.session.impersonation.originalCreator.email
    });
    
    console.log(`🎭 Admin ${req.session.impersonation.originalCreator.email} started impersonating ${targetUser.email}`);
    
    res.json({
      success: true,
      message: `Now impersonating ${targetUser.email}`,
      impersonation: {
        targetUser: {
          id: targetUser.dynamicId,
          email: targetUser.email,
          name: targetUser.name
        },
        originalUser: {
          email: req.session.impersonation.originalCreator.email,
          name: req.session.impersonation.originalCreator.name
        }
      }
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ 
      error: 'Failed to start impersonation' 
    });
  }
});

// Stop impersonating
router.post('/stop', async (req, res) => {
  try {
    if (!req.session.impersonation) {
      return res.status(400).json({ 
        error: 'Not currently impersonating' 
      });
    }
    
    const targetEmail = req.session.impersonation.targetEmail;
    const originalEmail = req.session.impersonation.originalCreator.email;
    
    // Restore original admin session
    req.session.creator = req.session.impersonation.originalCreator;
    delete req.session.impersonation;
    
    console.log(`🎭 Admin ${originalEmail} stopped impersonating ${targetEmail}`);
    
    res.json({
      success: true,
      message: 'Stopped impersonating',
      creator: req.session.creator
    });
  } catch (error) {
    console.error('Stop impersonation error:', error);
    res.status(500).json({ 
      error: 'Failed to stop impersonation' 
    });
  }
});

// Get impersonation status
router.get('/status', async (req, res) => {
  try {
    if (req.session.impersonation) {
      res.json({
        isImpersonating: true,
        targetUser: {
          email: req.session.impersonation.targetEmail,
          name: req.session.impersonation.targetName
        },
        originalUser: {
          email: req.session.impersonation.originalCreator.email,
          name: req.session.impersonation.originalCreator.name
        },
        startedAt: req.session.impersonation.startedAt
      });
    } else {
      res.json({
        isImpersonating: false
      });
    }
  } catch (error) {
    console.error('Get impersonation status error:', error);
    res.status(500).json({ 
      error: 'Failed to get impersonation status' 
    });
  }
});

// Search users for impersonation
router.get('/users/search', requireAdmin, async (req, res) => {
  try {
    const { query } = req.query;
    
    let whereClause = {
      role: 'creator' // Only show creators, not admins
    };
    
    if (query) {
      const { Op } = require('sequelize');
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { email: { [Op.like]: `%${query}%` } },
          { name: { [Op.like]: `%${query}%` } },
          { dynamicId: { [Op.like]: `%${query}%` } }
        ]
      };
    }
    
    const users = await UserRole.findAll({
      where: whereClause,
      attributes: ['dynamicId', 'email', 'name', 'createdAt', 'lastImpersonatedAt', 'lastImpersonatedBy'],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ 
      error: 'Failed to search users' 
    });
  }
});

module.exports = router;