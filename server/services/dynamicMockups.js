// Dynamic Mockups API Service for Backend
// Handles all Dynamic Mockups API interactions

const axios = require('axios');
const FormData = require('form-data');
const cloudinaryService = require('./cloudinary');

class DynamicMockupsService {
  constructor() {
    this.apiKey = process.env.DYNAMIC_MOCKUPS_API_KEY;
    this.baseUrl = 'https://app.dynamicmockups.com/api/v1';
    this.websiteKey = process.env.DYNAMIC_MOCKUPS_WEBSITE_KEY;
    
    // Initialize axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Cache for collections and templates
    this.collectionsCache = null;
    this.collectionsCacheTime = null;
    this.cacheTTL = 3600000; // 1 hour cache
  }

  // Check if service is configured
  isConfigured() {
    return !!(this.apiKey && process.env.DYNAMIC_MOCKUPS_ENABLED === 'true');
  }

  // Get all collections
  async getCollections() {
    // Check cache first
    if (this.collectionsCache && this.collectionsCacheTime && 
        (Date.now() - this.collectionsCacheTime) < this.cacheTTL) {
      console.log('📦 Returning cached collections');
      return this.collectionsCache;
    }

    try {
      console.log('🔄 Fetching collections from Dynamic Mockups...');
      const response = await this.client.get('/collections');
      
      // Handle nested response structure
      const collections = response.data?.data || response.data || [];
      
      // Cache the result
      this.collectionsCache = collections;
      this.collectionsCacheTime = Date.now();
      
      console.log(`✅ Fetched ${collections.length} collections`);
      return collections;
    } catch (error) {
      console.error('❌ Failed to fetch collections:', error.response?.data || error.message);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }
  }

  // Get mockups (optionally filtered by collection)
  async getMockups(collectionUuid = null) {
    try {
      console.log(`🔄 Fetching mockups${collectionUuid ? ` for collection ${collectionUuid}` : ''}...`);
      
      const params = {};
      if (collectionUuid) {
        params.collection_uuid = collectionUuid;
      }
      
      const response = await this.client.get('/mockups', { params });
      
      // Handle nested response structure
      const mockups = response.data?.data || response.data || [];
      
      console.log(`✅ Fetched ${mockups.length} mockups`);
      return mockups;
    } catch (error) {
      console.error('❌ Failed to fetch mockups:', error.response?.data || error.message);
      throw new Error(`Failed to fetch mockups: ${error.message}`);
    }
  }

  // Get specific mockup details
  async getMockup(mockupUuid) {
    try {
      console.log(`🔄 Fetching mockup ${mockupUuid}...`);
      const response = await this.client.get(`/mockup/${mockupUuid}`);
      
      // Handle nested response structure
      const mockupData = response.data?.data || response.data;
      
      console.log('✅ Fetched mockup details');
      return mockupData;
    } catch (error) {
      console.error('❌ Failed to fetch mockup:', error.response?.data || error.message);
      throw new Error(`Failed to fetch mockup: ${error.message}`);
    }
  }

  // Render a single mockup
  async renderMockup(options) {
    const {
      mockupUuid,
      designUrl,
      designConfig = {},
      exportOptions = {}
    } = options;

    try {
      console.log(`🎨 Rendering mockup ${mockupUuid}...`);
      
      // First, get the mockup details to find the smart object UUID
      const mockupDetails = await this.getMockup(mockupUuid);
      
      // Find the first smart object (usually the main design area)
      const smartObject = mockupDetails.smart_objects?.[0];
      if (!smartObject) {
        throw new Error(`No smart objects found in mockup ${mockupUuid}`);
      }
      
      console.log(`📍 Using smart object: ${smartObject.uuid} (${smartObject.name || 'Design Area'})`);
      
      // Build smart object configuration according to API docs
      const smartObjects = [{
        uuid: smartObject.uuid,
        asset: {
          url: designUrl,
          fit: designConfig.fit || 'stretch', // stretch, contain, or cover
          // Note: position, size, and rotate go at asset level, not nested
          position: {
            top: designConfig.y || 0,
            left: designConfig.x || 0
          },
          size: {
            width: designConfig.width || 100,
            height: designConfig.height || 100
          },
          rotate: designConfig.rotation || 0
        }
      }];

      // Build request body according to API documentation
      const requestBody = {
        mockup_uuid: mockupUuid,
        smart_objects: smartObjects,
        export_label: `tresr-${Date.now()}`,
        export_options: {
          image_format: exportOptions.format || 'png', // jpg, png, or webp
          image_size: exportOptions.size || 1200, // width in pixels
          mode: exportOptions.mode || null // 'view' to display in browser
        }
      };

      console.log('📤 Sending render request:', JSON.stringify(requestBody, null, 2));

      const response = await this.client.post('/renders', requestBody);
      
      // Handle nested response structure from API
      const responseData = response.data?.data || response.data;
      
      console.log('✅ Mockup rendered successfully');
      return {
        url: responseData.export_path || responseData.export_url,
        path: responseData.export_path,
        label: responseData.export_label
      };
    } catch (error) {
      console.error('❌ Failed to render mockup:', error.response?.data || error.message);
      throw new Error(`Failed to render mockup: ${error.response?.data?.message || error.message}`);
    }
  }

  // Bulk render multiple mockups from a collection
  async bulkRender(options) {
    const {
      collectionUuid,
      designUrl,
      designConfigs = {},
      exportOptions = {}
    } = options;

    try {
      console.log(`🎨 Bulk rendering collection ${collectionUuid}...`);
      
      // Build artworks mapping
      const artworks = {
        main_design: designUrl
      };

      // Build request body
      const requestBody = {
        collection_uuid: collectionUuid,
        artworks,
        export_label: `tresr-bulk-${Date.now()}`,
        export_options: {
          image_format: exportOptions.format || 'webp',
          image_size: exportOptions.size || 1200,
          mode: exportOptions.mode || 'download'
        }
      };

      const response = await this.client.post('/renders/bulk', requestBody);
      
      console.log(`✅ Bulk render completed: ${response.data.renders.length} mockups`);
      return response.data.renders;
    } catch (error) {
      console.error('❌ Failed to bulk render:', error.response?.data || error.message);
      throw new Error(`Failed to bulk render: ${error.message}`);
    }
  }

  // Generate print files
  async generatePrintFiles(options) {
    const {
      mockupUuid,
      designUrl,
      designConfig = {},
      printOptions = {}
    } = options;

    try {
      console.log(`🖨️ Generating print files for mockup ${mockupUuid}...`);
      
      // Get mockup details first to understand smart objects
      const mockup = await this.getMockup(mockupUuid);
      
      // Find the main design smart object
      const mainSmartObject = mockup.smart_objects?.[0];
      if (!mainSmartObject) {
        throw new Error('No smart object found in mockup');
      }

      // Build smart object configuration
      const smartObjects = [{
        uuid: mainSmartObject.uuid,
        asset: {
          url: designUrl,
          fit: designConfig.fit || 'contain',
          position: designConfig.position || { x: 0.5, y: 0.5 },
          scale: designConfig.scale || 1.0,
          rotation: designConfig.rotation || 0,
          dpi: printOptions.dpi || 300
        }
      }];

      // Build request body
      const requestBody = {
        mockup_uuid: mockupUuid,
        smart_objects: smartObjects,
        export_label: `tresr-print-${Date.now()}`,
        export_options: {
          image_format: printOptions.format || 'pdf',
          image_dpi: printOptions.dpi || 300,
          color_profile: printOptions.colorProfile || 'CMYK',
          include_bleed: printOptions.includeBleed !== false,
          include_cut_marks: printOptions.includeCutMarks !== false
        }
      };

      const response = await this.client.post('/renders/print-files', requestBody);
      
      console.log('✅ Print files generated successfully');
      return response.data.print_files;
    } catch (error) {
      console.error('❌ Failed to generate print files:', error.response?.data || error.message);
      throw new Error(`Failed to generate print files: ${error.message}`);
    }
  }

  // Upload PSD file and create mockup template
  async uploadPSD(options) {
    const {
      psdFileUrl,
      name,
      categoryId = 6, // Default to "Other" category
      createMockup = true,
      collections = []
    } = options;

    try {
      console.log(`📤 Uploading PSD: ${name}...`);
      
      const requestBody = {
        psd_file_url: psdFileUrl,
        psd_name: name,
        psd_category_id: categoryId
      };

      // Add mockup creation options if requested
      if (createMockup) {
        requestBody.mockup_template = {
          create_after_upload: true,
          collections: collections
        };
      }

      const response = await this.client.post('/psd/upload', requestBody);
      
      console.log('✅ PSD uploaded successfully');
      return {
        mockupUuid: response.data.mockup_uuid,
        mockupName: response.data.mockup_name,
        thumbnail: response.data.thumbnail_url,
        smartObjects: response.data.smart_objects
      };
    } catch (error) {
      console.error('❌ Failed to upload PSD:', error.response?.data || error.message);
      throw new Error(`Failed to upload PSD: ${error.message}`);
    }
  }

  // Get product mockup ID (synchronous version for quick lookups)
  getProductMockupId(productId) {
    // Actual Dynamic Mockups template UUIDs from your account
    const productMockupMap = {
      // T-Shirts
      'tee': 'aadbef17-d095-4c2a-b1fe-118e76b50e8a', // White Gildan 5000 T-shirt
      'boxy': '9988aa28-7a7c-4bd1-9200-6f30f4580fb0', // Dynamic Mockups Test V1 (T-shirt)
      'next-crop': '', // Need crop top template
      'baby-tee': 'aadbef17-d095-4c2a-b1fe-118e76b50e8a', // Using regular tee for now
      
      // Hoodies
      'wmn-hoodie': 'beaf974e-804f-47d1-9e7c-cb6e295f29ed', // Man in studio hoodie
      'med-hood': 'd8cdbf1f-0cf1-4a7f-a82d-d30296e95b48', // Man wearing hoodie in woods
      'mediu': 'b6fa0aab-d154-4fa5-91ce-3a1e4313f67f', // Young man in hoodie by wall
      'sweat': 'b6fa0aab-d154-4fa5-91ce-3a1e4313f67f', // Using hoodie template for now
      
      // Other products - need templates
      'patch-c': '', // Need hat template
      'patch-flat': '', // Need flat hat template
      'polo': '', // Need polo template
      'long-polo': '', // Need long polo template
      'mug': '', // Need mug template
      'art-sqsm': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Dynamic Mockups Test V1 (Artwork)
      'art-sqm': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Using same artwork template
      'art-lg': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Using same artwork template
      'nft': '' // Need trading card template
    };

    return productMockupMap[productId] || null;
  }

  // Map TRESR products to Dynamic Mockups templates
  async mapProductToMockup(productId) {
    // Actual Dynamic Mockups template UUIDs from your account
    const productMockupMap = {
      // T-Shirts
      'tee': 'aadbef17-d095-4c2a-b1fe-118e76b50e8a', // White Gildan 5000 T-shirt
      'boxy': '9988aa28-7a7c-4bd1-9200-6f30f4580fb0', // Dynamic Mockups Test V1 (T-shirt)
      'next-crop': '', // Need crop top template
      'baby-tee': 'aadbef17-d095-4c2a-b1fe-118e76b50e8a', // Using regular tee for now
      
      // Hoodies
      'wmn-hoodie': 'beaf974e-804f-47d1-9e7c-cb6e295f29ed', // Man in studio hoodie
      'med-hood': 'd8cdbf1f-0cf1-4a7f-a82d-d30296e95b48', // Man wearing hoodie in woods
      'mediu': 'b6fa0aab-d154-4fa5-91ce-3a1e4313f67f', // Young man in hoodie by wall
      'sweat': 'b6fa0aab-d154-4fa5-91ce-3a1e4313f67f', // Using hoodie template for now
      
      // Other products - need templates
      'patch-c': '', // Need hat template
      'patch-flat': '', // Need flat hat template
      'polo': '', // Need polo template
      'long-polo': '', // Need long polo template
      'mug': '', // Need mug template
      'art-sqsm': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Dynamic Mockups Test V1 (Artwork)
      'art-sqm': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Using same artwork template
      'art-lg': 'e607aea7-b0c4-4813-a603-6ee3d3e149f8', // Using same artwork template
      'nft': '' // Need trading card template
    };

    const uuid = productMockupMap[productId];
    
    if (!uuid) {
      console.warn(`⚠️ No Dynamic Mockups template mapped for product: ${productId}`);
      return null;
    }
    
    return uuid;
  }

  // Create or get TRESR collection
  async ensureTRESRCollection() {
    try {
      // Your TRESR Garments collection UUID
      const TRESR_COLLECTION_UUID = 'bf772f69-a436-43fb-af9d-91d5afba829a';
      
      return {
        uuid: TRESR_COLLECTION_UUID,
        name: 'TRESR Garments'
      };
    } catch (error) {
      console.error('Failed to ensure TRESR collection:', error);
      return null;
    }
  }
  
  // Get the TRESR collection UUID directly
  getTRESRCollectionUUID() {
    return 'bf772f69-a436-43fb-af9d-91d5afba829a';
  }

  // Upload design to Cloudinary and return URL
  async uploadDesignToCloudinary(imageDataUrl) {
    try {
      // Remove data URL prefix
      const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
      
      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadImage(base64Data, {
        folder: 'tresr-designs',
        resource_type: 'image'
      });

      return uploadResult.secure_url;
    } catch (error) {
      console.error('Failed to upload design to Cloudinary:', error);
      throw error;
    }
  }

  // Process multiple products efficiently
  async processProductBatch(products, designUrl) {
    const results = [];
    
    // Group products by collection if possible for bulk rendering
    const productsByCollection = {};
    
    for (const product of products) {
      const mockupUuid = await this.mapProductToMockup(product.id);
      if (mockupUuid) {
        // For now, process individually
        // In future, group by collection for bulk rendering
        try {
          const result = await this.renderMockup({
            mockupUuid,
            designUrl,
            designConfig: product.designConfig || {},
            exportOptions: {
              format: 'webp',
              size: 1200
            }
          });
          
          results.push({
            productId: product.id,
            success: true,
            mockupUrl: result.url
          });
        } catch (error) {
          results.push({
            productId: product.id,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  // Health check
  async healthCheck() {
    if (!this.isConfigured()) {
      return {
        status: 'disabled',
        message: 'Dynamic Mockups not configured or disabled'
      };
    }

    try {
      // Try to fetch collections as a health check
      await this.getCollections();
      return {
        status: 'healthy',
        message: 'Dynamic Mockups API is accessible'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `API Error: ${error.message}`
      };
    }
  }
}

// Export singleton instance
module.exports = new DynamicMockupsService();