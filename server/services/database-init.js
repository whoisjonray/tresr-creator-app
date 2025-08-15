const { sequelize, Design, CreatorMapping, UserRole } = require('../models');

async function initializeDatabase() {
  if (!sequelize) {
    console.log('⚠️ No database configured, skipping initialization');
    return;
  }

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync models (create tables if they don't exist)
    if (Design) {
      await Design.sync({ alter: false });
      console.log('✅ Design table ready');
    }
    
    if (UserRole) {
      await UserRole.sync({ alter: false });
      console.log('✅ UserRole table ready');
    }
    
    if (CreatorMapping) {
      await CreatorMapping.sync({ alter: false });
      console.log('✅ CreatorMapping table ready');
      
      // Set up memelord mapping if it doesn't exist
      try {
        const [mapping, created] = await CreatorMapping.findOrCreate({
          where: { sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e' },
          defaults: {
            sanityPersonId: 'k2r2aa8vmghuyr3he0p2eo5e',
            dynamicId: '31162d55-0da5-4b13-ad7c-3cafd170cebf',
            email: 'whoisjonray@gmail.com',
            sanityName: 'memelord',
            isVerified: true,
            metadata: {
              note: 'Auto-created on startup'
            }
          }
        });
        
        if (created) {
          console.log('✅ Created memelord mapping');
        }
      } catch (err) {
        console.log('⚠️ Could not create memelord mapping:', err.message);
      }
    }
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't crash the app, just log the error
  }
}

module.exports = { initializeDatabase };