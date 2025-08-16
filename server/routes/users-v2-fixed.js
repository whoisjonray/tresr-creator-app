const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Get models
const getModels = () => {
  const models = require('../models');
  return {
    UserRole: models.UserRole,
    Design: models.Design,
    CreatorMapping: models.CreatorMapping
  };
};

// Get user profile with designs
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { UserRole, Design } = getModels();
    const userId = req.session.creator.id;
    
    // Get user data
    const user = await UserRole.findOne({
      where: { dynamicId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get design count
    const designCount = await Design.count({
      where: { creatorId: userId }
    });
    
    res.json({
      success: true,
      user: {
        id: user.dynamicId,
        email: user.email,
        name: user.name,
        role: user.role,
        designCount: designCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { UserRole } = getModels();
    const userId = req.session.creator.id;
    const { name, bio, socialLinks } = req.body;
    
    const user = await UserRole.findOne({
      where: { dynamicId: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user
    await user.update({
      name: name || user.name,
      metadata: {
        ...user.metadata,
        bio,
        socialLinks
      }
    });
    
    res.json({
      success: true,
      message: 'Profile updated',
      user: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's designs with pagination
router.get('/designs', requireAuth, async (req, res) => {
  try {
    const { Design } = getModels();
    const userId = req.session.creator.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { creatorId: userId };
    if (status) {
      where.status = status;
    }
    
    const { count, rows } = await Design.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      designs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Publish design to Shopify
router.post('/designs/:id/publish', requireAuth, async (req, res) => {
  try {
    const { Design } = getModels();
    const { id } = req.params;
    const userId = req.session.creator.id;
    
    // Get design
    const design = await Design.findOne({
      where: { 
        id,
        creatorId: userId
      }
    });
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    
    // TODO: Implement Shopify publishing logic
    // For now, just update status
    await design.update({ status: 'published' });
    
    res.json({
      success: true,
      message: 'Design published to Shopify',
      design: design
    });
  } catch (error) {
    console.error('Error publishing design:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get commission history
router.get('/commissions', requireAuth, async (req, res) => {
  try {
    const userId = req.session.creator.id;
    
    // TODO: Implement commission tracking
    // For now, return mock data
    res.json({
      success: true,
      commissions: [],
      summary: {
        total: 0,
        pending: 0,
        paid: 0,
        rate: 40 // 40% commission rate
      }
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const { Design } = getModels();
    const userId = req.session.creator.id;
    
    // Get design stats
    const totalDesigns = await Design.count({
      where: { creatorId: userId }
    });
    
    const publishedDesigns = await Design.count({
      where: { 
        creatorId: userId,
        status: 'published'
      }
    });
    
    res.json({
      success: true,
      analytics: {
        designs: {
          total: totalDesigns,
          published: publishedDesigns,
          draft: totalDesigns - publishedDesigns
        },
        sales: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0
        },
        commissions: {
          earned: 0,
          pending: 0,
          paid: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;