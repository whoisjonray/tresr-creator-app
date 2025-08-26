const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// Admin check middleware
const requireAdmin = (req, res, next) => {
  const email = req.session?.creator?.email || req.session?.user?.email;
  console.log('Admin check - Session email:', email);
  
  if (email === 'whoisjonray@gmail.com') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      error: 'Admin access required',
      currentUser: email 
    });
  }
};

// Lazy load PrintAreaConfig to avoid circular dependency issues
let PrintAreaConfig = null;
const getPrintAreaConfig = () => {
  if (!PrintAreaConfig) {
    PrintAreaConfig = require('../models/PrintAreaConfig')(sequelize);
  }
  return PrintAreaConfig;
};

// Get current print areas (database-backed)
router.get('/print-areas', async (req, res) => {
  try {
    const PrintAreaConfigModel = getPrintAreaConfig();
    
    // Get configuration from database
    const printAreas = await PrintAreaConfigModel.getConfig('global_print_areas');
    
    if (printAreas) {
      console.log('✅ Loaded print areas from database');
      res.json({
        success: true,
        printAreas: printAreas,
        source: 'database',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ No print areas found in database, running migration...');
      
      // Trigger migration if no data exists
      try {
        const migrate = require('../scripts/migrate-print-areas-to-db');
        await migrate();
        
        // Try again after migration
        const migratedAreas = await PrintAreaConfigModel.getConfig('global_print_areas');
        
        res.json({
          success: true,
          printAreas: migratedAreas,
          source: 'database_migrated',
          timestamp: new Date().toISOString()
        });
      } catch (migrationError) {
        console.error('Migration failed:', migrationError);
        
        // Return defaults as last resort
        const defaultAreas = {
          'tee': { 
            front: { width: 280, height: 350, x: 160, y: 125 },
            back: { width: 280, height: 350, x: 160, y: 125 }
          },
          'mug': { 
            front: { width: 200, height: 210, x: 200, y: 180 },
            back: null
          }
        };
        
        res.json({
          success: true,
          printAreas: defaultAreas,
          source: 'emergency_defaults',
          warning: 'Using emergency defaults - database migration failed'
        });
      }
    }
  } catch (error) {
    console.error('Error loading print areas from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load print areas from database',
      details: error.message
    });
  }
});

// Save print areas (admin only - database-backed)
router.post('/print-areas', requireAdmin, async (req, res) => {
  try {
    const { printAreas } = req.body;
    
    if (!printAreas || typeof printAreas !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid print areas data provided'
      });
    }
    
    const PrintAreaConfigModel = getPrintAreaConfig();
    const email = req.session?.creator?.email || req.session?.user?.email;
    
    // Save to database
    const savedConfig = await PrintAreaConfigModel.setConfig(
      'global_print_areas', 
      printAreas, 
      email
    );
    
    console.log(`✅ Print areas updated in database by ${email}`);
    console.log(`   Garments configured: ${Object.keys(printAreas).length}`);
    
    // Create change log entry
    await PrintAreaConfigModel.setConfig('last_print_area_change', {
      timestamp: new Date().toISOString(),
      modifiedBy: email,
      garmentCount: Object.keys(printAreas).length,
      version: savedConfig.version
    }, email);
    
    res.json({
      success: true,
      message: 'Print areas saved to database successfully',
      updatedBy: email,
      timestamp: new Date().toISOString(),
      storage: 'database',
      version: savedConfig.version,
      garmentCount: Object.keys(printAreas).length
    });
    
  } catch (error) {
    console.error('Error saving print areas to database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save print areas to database',
      details: error.message
    });
  }
});

// Get print areas history (admin only)
router.get('/print-areas/history', requireAdmin, async (req, res) => {
  try {
    const PrintAreaConfigModel = getPrintAreaConfig();
    
    // Get all historical versions
    const history = await PrintAreaConfigModel.findAll({
      where: { configKey: 'global_print_areas' },
      order: [['updatedAt', 'DESC']],
      limit: 10,
      attributes: ['version', 'lastModifiedBy', 'updatedAt', 'createdAt']
    });
    
    // Get migration metadata
    const migrationData = await PrintAreaConfigModel.getConfig('migration_metadata');
    const lastChange = await PrintAreaConfigModel.getConfig('last_print_area_change');
    
    res.json({
      success: true,
      history: history,
      migrationData: migrationData,
      lastChange: lastChange
    });
    
  } catch (error) {
    console.error('Error fetching print areas history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      details: error.message
    });
  }
});

// Health check for database persistence
router.get('/health/persistence', async (req, res) => {
  try {
    const PrintAreaConfigModel = getPrintAreaConfig();
    
    // Test database connection
    await sequelize.authenticate();
    
    // Test read operation
    const config = await PrintAreaConfigModel.getConfig('global_print_areas');
    const hasConfig = !!config;
    
    // Test write operation (only if admin)
    let canWrite = false;
    const email = req.session?.creator?.email || req.session?.user?.email;
    if (email === 'whoisjonray@gmail.com') {
      try {
        await PrintAreaConfigModel.setConfig('health_check', {
          timestamp: new Date().toISOString(),
          test: true
        }, 'health-check');
        canWrite = true;
      } catch (writeError) {
        console.warn('Write test failed:', writeError.message);
      }
    }
    
    res.json({
      success: true,
      database: {
        connected: true,
        canRead: true,
        canWrite: canWrite,
        hasConfiguration: hasConfig
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      database: {
        connected: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;