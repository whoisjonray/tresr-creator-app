const express = require('express');
const router = express.Router();
const sanityMigration = require('../services/sanityMigration');
const { Creator, Design, CreatorMapping } = require('../models');

/**
 * Sanity Import API v2
 * 
 * Provides comprehensive endpoints for importing designs and creators from Sanity CMS.
 * Includes auto-detection, batch processing, job status tracking, and mapping management.
 */

// In-memory job tracking (in production, use Redis or database)
const importJobs = new Map();

/**
 * Generate unique job ID
 */
function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create job tracking entry
 */
function createJob(jobId, type, metadata = {}) {
  const job = {
    id: jobId,
    type,
    status: 'pending',
    progress: 0,
    startTime: new Date().toISOString(),
    endTime: null,
    metadata,
    results: null,
    errors: []
  };
  importJobs.set(jobId, job);
  return job;
}

/**
 * Update job status
 */
function updateJob(jobId, updates) {
  const job = importJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
    if (updates.status === 'completed' || updates.status === 'failed') {
      job.endTime = new Date().toISOString();
    }
    importJobs.set(jobId, job);
  }
  return job;
}

/**
 * POST /api/sanity/import/auto-detect
 * Auto-detect and import user's designs from Sanity
 */
router.post('/auto-detect', async (req, res) => {
  try {
    const { 
      creatorId, 
      email, 
      walletAddress, 
      autoImport = false,
      batchSize = 5 
    } = req.body;

    // Validation
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREATOR_ID',
        message: 'Creator ID is required'
      });
    }

    if (!email && !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SEARCH_CRITERIA',
        message: 'Email or wallet address is required for detection'
      });
    }

    const jobId = generateJobId();
    const job = createJob(jobId, 'auto-detect', {
      creatorId,
      email,
      walletAddress,
      autoImport,
      batchSize
    });

    // Start async processing
    processAutoDetection(jobId, creatorId, email, walletAddress, autoImport, batchSize);

    res.json({
      success: true,
      jobId,
      message: autoImport ? 'Auto-detection and import started' : 'Auto-detection started',
      estimatedTime: '30-60 seconds'
    });

  } catch (error) {
    console.error('Auto-detect error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTO_DETECT_FAILED',
      message: 'Failed to start auto-detection process'
    });
  }
});

/**
 * Process auto-detection in background
 */
async function processAutoDetection(jobId, creatorId, email, walletAddress, autoImport, batchSize) {
  try {
    updateJob(jobId, { status: 'running', progress: 10 });

    // Step 1: Find potential matches in Sanity
    const matches = await sanityMigration.findCreatorMatches(email, walletAddress);
    
    updateJob(jobId, { 
      progress: 30, 
      metadata: { matchesFound: matches.length }
    });

    if (matches.length === 0) {
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        results: {
          matches: [],
          imported: [],
          message: 'No matching creators found in Sanity'
        }
      });
      return;
    }

    // Step 2: Get design counts for each match
    const enrichedMatches = [];
    for (const match of matches) {
      try {
        const designs = await sanityMigration.fetchDesignsByCreator(match._id);
        enrichedMatches.push({
          ...match,
          designCount: designs.length,
          designs: designs.slice(0, 3) // Preview of first 3 designs
        });
      } catch (error) {
        console.error(`Error fetching designs for ${match._id}:`, error);
        enrichedMatches.push({
          ...match,
          designCount: 0,
          designs: [],
          error: 'Failed to fetch designs'
        });
      }
    }

    updateJob(jobId, { 
      progress: 60,
      metadata: { 
        matchesFound: matches.length,
        enrichedMatches: enrichedMatches.length
      }
    });

    let importResults = [];

    // Step 3: Auto-import if requested
    if (autoImport && enrichedMatches.length > 0) {
      // Import from the best match (most designs)
      const bestMatch = enrichedMatches.reduce((prev, current) => 
        (prev.designCount > current.designCount) ? prev : current
      );

      updateJob(jobId, { 
        progress: 70,
        metadata: { 
          importing: true,
          bestMatch: bestMatch._id,
          designsToImport: bestMatch.designCount
        }
      });

      // Create or update creator mapping
      await CreatorMapping.upsert({
        dynamicId: creatorId,
        sanityId: bestMatch._id,
        email: email,
        walletAddress: walletAddress,
        creatorName: bestMatch.name || 'Unknown',
        isVerified: true,
        mappingSource: 'auto-detect',
        metadata: {
          autoDetected: true,
          detectionDate: new Date().toISOString(),
          sanityDesignCount: bestMatch.designCount
        }
      });

      // Import designs
      importResults = await sanityMigration.batchImportDesigns(
        bestMatch._id, 
        creatorId, 
        Design
      );

      updateJob(jobId, { progress: 95 });
    }

    // Complete job
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      results: {
        matches: enrichedMatches,
        imported: importResults,
        autoImported: autoImport,
        message: `Found ${enrichedMatches.length} potential matches${autoImport ? `, imported ${importResults.imported?.length || 0} designs` : ''}`
      }
    });

  } catch (error) {
    console.error('Auto-detection processing error:', error);
    updateJob(jobId, {
      status: 'failed',
      progress: 0,
      errors: [error.message]
    });
  }
}

/**
 * POST /api/sanity/import/batch
 * Batch import multiple creators
 */
router.post('/batch', async (req, res) => {
  try {
    const { 
      mappings, 
      options = {} 
    } = req.body;

    // Validation
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MAPPINGS',
        message: 'Mappings array is required and cannot be empty'
      });
    }

    // Validate each mapping
    for (const mapping of mappings) {
      if (!mapping.dynamicId || !mapping.sanityId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_MAPPING',
          message: 'Each mapping must have dynamicId and sanityId'
        });
      }
    }

    const jobId = generateJobId();
    const job = createJob(jobId, 'batch-import', {
      mappingsCount: mappings.length,
      options
    });

    // Start async processing
    processBatchImport(jobId, mappings, options);

    res.json({
      success: true,
      jobId,
      message: `Batch import started for ${mappings.length} creators`,
      estimatedTime: `${Math.ceil(mappings.length * 0.5)} minutes`
    });

  } catch (error) {
    console.error('Batch import error:', error);
    res.status(500).json({
      success: false,
      error: 'BATCH_IMPORT_FAILED',
      message: 'Failed to start batch import process'
    });
  }
});

/**
 * Process batch import in background
 */
async function processBatchImport(jobId, mappings, options) {
  try {
    updateJob(jobId, { status: 'running', progress: 5 });

    const results = {
      processed: 0,
      successful: [],
      failed: [],
      totalDesigns: 0
    };

    const totalMappings = mappings.length;

    // Process each mapping
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const progress = Math.floor(((i + 1) / totalMappings) * 90) + 5;

      try {
        updateJob(jobId, { 
          progress,
          metadata: { 
            currentMapping: mapping,
            processed: i,
            total: totalMappings
          }
        });

        // Create or update creator mapping
        await CreatorMapping.upsert({
          dynamicId: mapping.dynamicId,
          sanityId: mapping.sanityId,
          email: mapping.email || null,
          walletAddress: mapping.walletAddress || null,
          creatorName: mapping.creatorName || 'Unknown',
          isVerified: true,
          mappingSource: 'batch-import',
          metadata: {
            batchImported: true,
            importDate: new Date().toISOString(),
            batchJobId: jobId
          }
        });

        // Import designs for this creator
        const importResults = await sanityMigration.batchImportDesigns(
          mapping.sanityId,
          mapping.dynamicId,
          Design
        );

        results.successful.push({
          mapping,
          importResults,
          designsImported: importResults.imported?.length || 0,
          designsUpdated: importResults.updated?.length || 0,
          errors: importResults.errors?.length || 0
        });

        results.totalDesigns += (importResults.imported?.length || 0) + (importResults.updated?.length || 0);

      } catch (error) {
        console.error(`Failed to process mapping ${mapping.dynamicId} -> ${mapping.sanityId}:`, error);
        results.failed.push({
          mapping,
          error: error.message
        });
      }

      results.processed++;
    }

    // Complete job
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      results
    });

  } catch (error) {
    console.error('Batch import processing error:', error);
    updateJob(jobId, {
      status: 'failed',
      progress: 0,
      errors: [error.message]
    });
  }
}

/**
 * GET /api/sanity/import/status/:jobId
 * Check import job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_JOB_ID',
        message: 'Job ID is required'
      });
    }

    const job = importJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'JOB_NOT_FOUND',
        message: 'Job not found or has expired'
      });
    }

    // Calculate estimated completion time
    let estimatedCompletion = null;
    if (job.status === 'running' && job.progress > 0) {
      const elapsed = new Date() - new Date(job.startTime);
      const remaining = (elapsed / job.progress) * (100 - job.progress);
      estimatedCompletion = new Date(Date.now() + remaining).toISOString();
    }

    res.json({
      success: true,
      job: {
        ...job,
        estimatedCompletion
      }
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: 'Failed to check job status'
    });
  }
});

/**
 * POST /api/sanity/mapping/create
 * Create creator mapping manually
 */
router.post('/mapping/create', async (req, res) => {
  try {
    const {
      dynamicId,
      sanityId,
      email,
      walletAddress,
      creatorName,
      isVerified = false,
      metadata = {}
    } = req.body;

    // Validation
    if (!dynamicId || !sanityId) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'dynamicId and sanityId are required'
      });
    }

    // Check if mapping already exists
    const existingMapping = await CreatorMapping.findOne({
      where: { dynamicId, sanityId }
    });

    if (existingMapping) {
      return res.status(409).json({
        success: false,
        error: 'MAPPING_EXISTS',
        message: 'Mapping already exists for this creator'
      });
    }

    // Verify the Sanity creator exists
    try {
      const sanityPerson = await sanityMigration.fetchPerson(sanityId);
      if (!sanityPerson) {
        return res.status(404).json({
          success: false,
          error: 'SANITY_CREATOR_NOT_FOUND',
          message: 'Creator not found in Sanity'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SANITY_ID',
        message: 'Invalid Sanity creator ID'
      });
    }

    // Create mapping
    const mapping = await CreatorMapping.create({
      dynamicId,
      sanityId,
      email,
      walletAddress,
      creatorName: creatorName || 'Unknown',
      isVerified,
      mappingSource: 'manual',
      metadata: {
        ...metadata,
        createdDate: new Date().toISOString(),
        createdBy: 'manual'
      }
    });

    res.json({
      success: true,
      mapping,
      message: 'Creator mapping created successfully'
    });

  } catch (error) {
    console.error('Create mapping error:', error);
    res.status(500).json({
      success: false,
      error: 'MAPPING_CREATION_FAILED',
      message: 'Failed to create creator mapping'
    });
  }
});

/**
 * GET /api/sanity/mapping/suggest
 * Suggest mappings by email/wallet
 */
router.get('/mapping/suggest', async (req, res) => {
  try {
    const { 
      email, 
      walletAddress, 
      limit = 10 
    } = req.query;

    if (!email && !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SEARCH_CRITERIA',
        message: 'Email or wallet address is required'
      });
    }

    // Find matches in Sanity
    const sanityMatches = await sanityMigration.findCreatorMatches(email, walletAddress);

    // Get design counts and enrich data
    const suggestions = await Promise.all(
      sanityMatches.slice(0, limit).map(async (match) => {
        try {
          const designs = await sanityMigration.fetchDesignsByCreator(match._id);
          
          // Check if already mapped
          const existingMapping = await CreatorMapping.findOne({
            where: { sanityId: match._id }
          });

          return {
            sanityId: match._id,
            name: match.name,
            email: match.email,
            username: match.username,
            walletAddress: match.walletAddress,
            wallets: match.wallets || [],
            designCount: designs.length,
            isAlreadyMapped: !!existingMapping,
            existingDynamicId: existingMapping?.dynamicId || null,
            matchReasons: [
              ...(email && match.email === email ? ['email_exact'] : []),
              ...(walletAddress && (match.walletAddress === walletAddress || match.wallets?.includes(walletAddress)) ? ['wallet_exact'] : [])
            ],
            confidence: calculateMatchConfidence(match, email, walletAddress)
          };
        } catch (error) {
          console.error(`Error processing match ${match._id}:`, error);
          return {
            sanityId: match._id,
            name: match.name,
            email: match.email,
            error: 'Failed to fetch additional data'
          };
        }
      })
    );

    // Sort by confidence score
    suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    res.json({
      success: true,
      suggestions,
      metadata: {
        searchCriteria: { email, walletAddress },
        totalFound: sanityMatches.length,
        returned: suggestions.length
      }
    });

  } catch (error) {
    console.error('Mapping suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'SUGGESTION_FAILED',
      message: 'Failed to generate mapping suggestions'
    });
  }
});

/**
 * Calculate match confidence score
 */
function calculateMatchConfidence(match, email, walletAddress) {
  let confidence = 0;

  // Email match
  if (email && match.email === email) {
    confidence += 50;
  }

  // Wallet match
  if (walletAddress && (match.walletAddress === walletAddress || match.wallets?.includes(walletAddress))) {
    confidence += 40;
  }

  // Has username
  if (match.username) {
    confidence += 5;
  }

  // Has name
  if (match.name) {
    confidence += 5;
  }

  return Math.min(confidence, 100);
}

/**
 * GET /api/sanity/stats
 * Get Sanity migration statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await sanityMigration.getMigrationStats();
    
    // Get local statistics
    const localStats = {
      mappedCreators: await CreatorMapping.count(),
      importedDesigns: await Design.count({ where: { sanityId: { [require('sequelize').Op.not]: null } } }),
      totalDesigns: await Design.count()
    };

    res.json({
      success: true,
      sanityStats: stats,
      localStats,
      migrationProgress: {
        creatorsProgress: localStats.mappedCreators / (stats?.creatorsWithDesigns || 1),
        designsProgress: localStats.importedDesigns / (stats?.totalDesigns || 1)
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'STATS_FAILED',
      message: 'Failed to fetch migration statistics'
    });
  }
});

// Cleanup old jobs (runs every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [jobId, job] of importJobs.entries()) {
    if (new Date(job.startTime).getTime() < oneHourAgo) {
      importJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000);

module.exports = router;