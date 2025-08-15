const express = require('express');
const router = express.Router();
const { UserRole } = require('../models');

// TEMPORARY ENDPOINT - Remove after setup
router.get('/setup-jon-admin', async (req, res) => {
  try {
    const jonRayUser = {
      dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
      email: 'whoisjonray@gmail.com',
      role: 'admin',
      name: 'Jon Ray'
    };
    
    // Find or create user
    let user = await UserRole.findOne({
      where: { email: jonRayUser.email }
    });
    
    if (user) {
      await user.update({
        dynamicId: jonRayUser.dynamicId,
        role: 'admin',
        name: jonRayUser.name
      });
      res.json({ 
        success: true, 
        message: 'Updated to admin role. Please log out and log back in.' 
      });
    } else {
      await UserRole.create(jonRayUser);
      res.json({ 
        success: true, 
        message: 'Created admin user. Please log out and log back in.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      hint: 'Try logging in first to create your user record, then visit this endpoint again.'
    });
  }
});

module.exports = router;