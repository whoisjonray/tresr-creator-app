const express = require('express');
const router = express.Router();
const databaseService = require('../services/database');
const axios = require('axios');

// Sanity configuration
const SANITY_PROJECT_ID = 'a9vtdosx';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2023-01-01';
const SANITY_TOKEN = process.env.SANITY_TOKEN || '';

// Convert Sanity bounding box coordinates to TRESR center-based coordinates
const convertSanityToTRESRCoordinates = (topLeft, bottomRight) => {
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  const centerX = topLeft.x + (width / 2);
  const centerY = topLeft.y + (height / 2);
  
  return {
    x: centerX,
    y: centerY,
    width: width,
    height: height
  };
};

// Import specific design from Sanity
router.post('/import/:designId', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Only allow whoisjonray@gmail.com for now (testing)
    if (req.session.user.email !== 'whoisjonray@gmail.com') {
      return res.status(403).json({ error: 'Not authorized for import' });
    }
    
    const { designId } = req.params;
    const creatorId = req.session.user.id;
    
    console.log(`📥 Importing design ${designId} for creator ${creatorId}`);
    
    // Fetch design from Sanity
    const query = `*[_type == "design" && _id == "${designId}"][0]{
      _id,
      name,
      slug,
      description,
      "images": rawArtwork[]{
        _key,
        "url": asset->url,
        canvasData
      },
      "creator": person->{
        _id,
        name,
        slug,
        email
      }
    }`;
    
    const sanityUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    
    const sanityResponse = await axios.get(sanityUrl, {
      headers: {
        Authorization: SANITY_TOKEN ? `Bearer ${SANITY_TOKEN}` : undefined
      }
    });
    
    const sanityDesign = sanityResponse.data.result;
    
    if (!sanityDesign) {
      return res.status(404).json({ error: 'Design not found in Sanity' });
    }
    
    console.log('📦 Found Sanity design:', sanityDesign.name);
    
    // Convert Sanity design to TRESR format
    const designElements = [];
    
    if (sanityDesign.images && sanityDesign.images.length > 0) {
      sanityDesign.images.forEach((image, index) => {
        if (image.canvasData) {
          // Extract garment positions from canvasData
          Object.entries(image.canvasData).forEach(([garmentType, positionData]) => {
            if (positionData.topLeft && positionData.bottomRight) {
              const tresrCoords = convertSanityToTRESRCoordinates(
                positionData.topLeft,
                positionData.bottomRight
              );
              
              designElements.push({
                type: 'image',
                src: image.url,
                garmentType: garmentType,
                position: tresrCoords,
                scale: 1,
                rotation: 0
              });
              
              console.log(`  📐 Converted ${garmentType} coordinates:`, {
                sanity: { topLeft: positionData.topLeft, bottomRight: positionData.bottomRight },
                tresr: tresrCoords
              });
            }
          });
        }
      });
    }
    
    // Create design in database
    const designData = {
      name: sanityDesign.name || 'Imported Design',
      description: sanityDesign.description || '',
      design_data: {
        elements: designElements,
        backgroundColor: '#ffffff',
        metadata: {
          importedFrom: 'sanity',
          sanityId: sanityDesign._id,
          importDate: new Date().toISOString()
        }
      },
      thumbnail_url: sanityDesign.images?.[0]?.url || null,
      is_public: false
    };
    
    console.log('💾 Creating design in database...');
    const newDesign = await databaseService.createDesign(creatorId, designData);
    
    console.log('✅ Design imported successfully:', newDesign.id);
    
    res.json({
      success: true,
      design: newDesign,
      message: `Successfully imported "${sanityDesign.name}"`
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import design',
      details: error.message 
    });
  }
});

// Get import status for current user
router.get('/import-status', async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Check if user is admin
    const isAdmin = req.session.user.email === 'whoisjonray@gmail.com';
    
    res.json({
      canImport: isAdmin,
      user: {
        email: req.session.user.email,
        id: req.session.user.id
      }
    });
    
  } catch (error) {
    console.error('Error checking import status:', error);
    res.status(500).json({ error: 'Failed to check import status' });
  }
});

// TEST ENDPOINT: Import JUST Grok IT without authentication
router.post('/test-import-just-grok-it', async (req, res) => {
  try {
    const JUST_GROK_IT_ID = '27b6e93d-0e7d-4f78-9905-74a66c504a17';
    const TEST_CREATOR_ID = '31162d55-0da5-4b13-ad7c-3cafd170cebf'; // whoisjonray@gmail.com
    
    console.log('🧪 TEST: Importing JUST Grok IT design...');
    
    // Fetch design from Sanity
    const query = `*[_type == "design" && _id == "${JUST_GROK_IT_ID}"][0]{
      _id,
      name,
      slug,
      description,
      "images": rawArtwork[]{
        _key,
        "url": asset->url,
        canvasData
      },
      "creator": person->{
        _id,
        name,
        slug,
        email
      }
    }`;
    
    const sanityUrl = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
    
    const sanityResponse = await axios.get(sanityUrl);
    const sanityDesign = sanityResponse.data.result;
    
    if (!sanityDesign) {
      return res.status(404).json({ error: 'JUST Grok IT design not found in Sanity' });
    }
    
    console.log('📦 Found Sanity design:', sanityDesign.name);
    console.log('📸 Images found:', sanityDesign.images?.length || 0);
    
    // Convert Sanity design to TRESR format with coordinate conversion
    const designElements = [];
    const coordinateLog = [];
    
    if (sanityDesign.images && sanityDesign.images.length > 0) {
      sanityDesign.images.forEach((image, index) => {
        console.log(`\n🖼️ Processing image ${index + 1}:`, image.url);
        
        if (image.canvasData) {
          // Extract garment positions from canvasData
          Object.entries(image.canvasData).forEach(([garmentType, positionData]) => {
            if (positionData.topLeft && positionData.bottomRight) {
              // Convert from Sanity bounding box to TRESR center-based coordinates
              const tresrCoords = convertSanityToTRESRCoordinates(
                positionData.topLeft,
                positionData.bottomRight
              );
              
              designElements.push({
                type: 'image',
                src: image.url,
                garmentType: garmentType,
                position: tresrCoords,
                scale: 1,
                rotation: 0
              });
              
              const logEntry = {
                garmentType,
                sanity: {
                  topLeft: positionData.topLeft,
                  bottomRight: positionData.bottomRight,
                  width: positionData.bottomRight.x - positionData.topLeft.x,
                  height: positionData.bottomRight.y - positionData.topLeft.y
                },
                tresr: tresrCoords
              };
              
              coordinateLog.push(logEntry);
              console.log(`  📐 Converted ${garmentType} coordinates:`, logEntry);
            }
          });
        } else {
          // If no canvas data, use default centered position
          console.log('  ⚠️ No canvas data found, using default position');
          designElements.push({
            type: 'image',
            src: image.url,
            garmentType: 'default',
            position: { x: 500, y: 500, width: 400, height: 400 },
            scale: 1,
            rotation: 0
          });
        }
      });
    }
    
    // Create design in database
    const designData = {
      name: sanityDesign.name || 'JUST Grok IT',
      description: sanityDesign.description || 'Imported from Sanity with coordinate conversion',
      design_data: {
        elements: designElements,
        backgroundColor: '#ffffff',
        metadata: {
          importedFrom: 'sanity',
          sanityId: sanityDesign._id,
          importDate: new Date().toISOString(),
          coordinateConversion: 'bounding-box-to-center',
          coordinateLog: coordinateLog
        }
      },
      thumbnail_url: sanityDesign.images?.[0]?.url || null,
      is_public: false
    };
    
    console.log('\n💾 Creating design in database with converted coordinates...');
    const newDesign = await databaseService.createDesign(TEST_CREATOR_ID, designData);
    
    console.log('✅ Design imported successfully with coordinate conversion:', newDesign.id);
    
    res.json({
      success: true,
      design: {
        id: newDesign.id,
        name: newDesign.name,
        elementCount: designElements.length,
        coordinatesConverted: coordinateLog.length
      },
      coordinateConversion: coordinateLog,
      message: `Successfully imported "${sanityDesign.name}" with ${coordinateLog.length} coordinate conversions`
    });
    
  } catch (error) {
    console.error('❌ Test import error:', error);
    res.status(500).json({ 
      error: 'Failed to import JUST Grok IT',
      details: error.message 
    });
  }
});

module.exports = router;