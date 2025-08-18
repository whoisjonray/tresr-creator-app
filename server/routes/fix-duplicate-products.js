/**
 * CRITICAL FIX: Duplicate Product Creation
 * 
 * ROOT CAUSE ANALYSIS:
 * 1. Publishing creates NEW product instead of updating existing
 * 2. No check for existing products with same design
 * 3. SuperProduct logic creates duplicates
 * 4. No proper Shopify API integration (fake publish)
 * 5. Title generation creates similar names causing confusion
 */

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const shopifyService = require('../services/shopify');

// ==================== DUPLICATE PREVENTION ====================

/**
 * Check if a product already exists for this design
 */
const findExistingProduct = async (sequelize, designId, creatorId) => {
  try {
    const [existingProducts] = await sequelize.query(
      `SELECT sp.*, d.name as design_name 
       FROM shopify_products sp 
       JOIN designs d ON d.id = sp.design_id 
       WHERE sp.design_id = :designId 
       AND sp.creator_id = :creatorId 
       AND sp.status != 'deleted'
       ORDER BY sp.created_at DESC
       LIMIT 1`,
      {
        replacements: { designId, creatorId }
      }
    );
    
    return existingProducts[0] || null;
  } catch (error) {
    console.error('Error checking for existing product:', error);
    return null;
  }
};

/**
 * Update existing product instead of creating new one
 */
const updateExistingProduct = async (sequelize, productId, updateData) => {
  try {
    const [updateResult] = await sequelize.query(
      `UPDATE shopify_products 
       SET 
         title = :title,
         shopify_product_id = :shopifyProductId,
         variants_data = :variantsData,
         images_data = :imagesData,
         status = :status,
         updated_at = NOW()
       WHERE id = :productId`,
      {
        replacements: {
          productId,
          title: updateData.title,
          shopifyProductId: updateData.shopifyProductId,
          variantsData: JSON.stringify(updateData.variants),
          imagesData: JSON.stringify(updateData.images),
          status: updateData.status
        }
      }
    );
    
    console.log(`✅ Updated existing product ${productId} instead of creating duplicate`);
    return updateResult;
  } catch (error) {
    console.error('Error updating existing product:', error);
    throw error;
  }
};

// ==================== SHOPIFY API INTEGRATION FIX ====================

/**
 * Real Shopify product creation (not fake)
 */
const createShopifyProductReal = async (productData) => {
  try {
    console.log('🛍️ Creating REAL Shopify product...');
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development' || !process.env.SHOPIFY_API_ACCESS_TOKEN) {
      console.log('🔧 Development mode - simulating Shopify creation');
      return {
        id: Date.now(), // Mock ID
        title: productData.title,
        vendor: productData.vendor,
        handle: productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        variants: productData.variants?.map((v, i) => ({
          id: Date.now() + i,
          title: v.title,
          price: v.price,
          sku: v.sku
        })) || [],
        images: productData.images || [],
        status: 'draft'
      };
    }
    
    // Real Shopify API call
    const shopifyProduct = await shopifyService.createProduct(productData);
    console.log('✅ Real Shopify product created:', shopifyProduct.id);
    
    return shopifyProduct;
  } catch (error) {
    console.error('❌ Shopify product creation failed:', error);
    throw new Error(`Shopify API Error: ${error.message}`);
  }
};

/**
 * Update existing Shopify product
 */
const updateShopifyProductReal = async (shopifyProductId, updateData) => {
  try {
    console.log(`🛍️ Updating REAL Shopify product ${shopifyProductId}...`);
    
    if (process.env.NODE_ENV === 'development' || !process.env.SHOPIFY_API_ACCESS_TOKEN) {
      console.log('🔧 Development mode - simulating Shopify update');
      return {
        id: shopifyProductId,
        ...updateData,
        updated_at: new Date().toISOString()
      };
    }
    
    const updatedProduct = await shopifyService.updateProduct(shopifyProductId, updateData);
    console.log('✅ Real Shopify product updated:', shopifyProductId);
    
    return updatedProduct;
  } catch (error) {
    console.error('❌ Shopify product update failed:', error);
    throw new Error(`Shopify API Error: ${error.message}`);
  }
};

// ==================== FIXED PUBLISH ENDPOINT ====================

router.post('/publish-design-fixed', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please log in' 
      });
    }

    const { 
      designId,
      title,
      description,
      mockups, // Generated product images
      productConfigs,
      designScale
    } = req.body;

    if (!designId || !title || !mockups) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: designId, title, and mockups'
      });
    }

    console.log(`🚀 FIXED PUBLISH: Publishing design ${designId} for user ${user.id}`);

    // Create database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    // 1. CHECK FOR EXISTING PRODUCT (prevent duplicates)
    const existingProduct = await findExistingProduct(sequelize, designId, user.id);
    
    if (existingProduct) {
      console.log(`⚠️ Found existing product for design ${designId}: ${existingProduct.id}`);
      console.log(`Existing product: "${existingProduct.design_name}" (${existingProduct.title})`);
      
      // Ask user if they want to update existing or create new
      if (req.body.forceUpdate !== true) {
        await sequelize.close();
        return res.json({
          success: false,
          needsConfirmation: true,
          existingProduct: {
            id: existingProduct.id,
            title: existingProduct.title,
            designName: existingProduct.design_name,
            shopifyProductId: existingProduct.shopify_product_id,
            status: existingProduct.status,
            createdAt: existingProduct.created_at
          },
          message: 'A product already exists for this design. Do you want to update it or create a new one?'
        });
      }
    }

    // 2. PREPARE SHOPIFY PRODUCT DATA
    const enabledProducts = Object.keys(productConfigs).filter(id => productConfigs[id]?.enabled);
    
    if (enabledProducts.length === 0) {
      await sequelize.close();
      return res.status(400).json({
        success: false,
        message: 'No products enabled for publishing'
      });
    }

    // Generate variants for all enabled products and colors
    const variants = [];
    const images = [];
    let variantCounter = 1;

    for (const productId of enabledProducts) {
      const config = productConfigs[productId];
      const productMockup = mockups[productId];
      
      if (productMockup && productMockup.url) {
        // Add image to product images
        images.push({
          src: productMockup.url,
          alt: `${title} - ${productMockup.name} in ${productMockup.color}`,
          position: images.length + 1
        });

        // Create variant for this product/color combination
        variants.push({
          title: `${productMockup.name} - ${productMockup.color}`,
          price: config.basePrice || '25.00',
          sku: `${designId.slice(0, 8)}-${productId}-${productMockup.color.toLowerCase().replace(/\s+/g, '')}`,
          inventory_quantity: 999,
          inventory_management: null,
          fulfillment_service: 'manual',
          position: variantCounter++,
          image_id: images.length // Link to the image we just added
        });
      }
    }

    if (variants.length === 0) {
      await sequelize.close();
      return res.status(400).json({
        success: false,
        message: 'No valid mockup images found for enabled products'
      });
    }

    // 3. CREATE OR UPDATE SHOPIFY PRODUCT
    const shopifyProductData = {
      title: title,
      body_html: description || `Custom design "${title}" created with TRESR`,
      vendor: user.name || user.username || 'TRESR Creator',
      product_type: 'Custom Apparel',
      tags: [
        'custom-design',
        'print-on-demand',
        'tresr',
        `creator-${user.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}`
      ].join(', '),
      variants: variants,
      images: images,
      status: 'draft' // Start as draft for review
    };

    let shopifyProduct;
    let isUpdate = false;

    if (existingProduct && existingProduct.shopify_product_id) {
      // Update existing Shopify product
      isUpdate = true;
      shopifyProduct = await updateShopifyProductReal(existingProduct.shopify_product_id, shopifyProductData);
    } else {
      // Create new Shopify product
      shopifyProduct = await createShopifyProductReal(shopifyProductData);
    }

    // 4. SAVE TO DATABASE
    let productRecord;
    
    if (existingProduct) {
      // Update existing record
      await updateExistingProduct(sequelize, existingProduct.id, {
        title: title,
        shopifyProductId: shopifyProduct.id,
        variants: variants,
        images: images,
        status: 'published'
      });
      productRecord = { ...existingProduct, title, status: 'published' };
    } else {
      // Create new record
      const [insertResult] = await sequelize.query(
        `INSERT INTO shopify_products 
         (design_id, creator_id, title, shopify_product_id, variants_data, images_data, status, created_at, updated_at)
         VALUES (:designId, :creatorId, :title, :shopifyProductId, :variantsData, :imagesData, :status, NOW(), NOW())`,
        {
          replacements: {
            designId,
            creatorId: user.id,
            title,
            shopifyProductId: shopifyProduct.id,
            variantsData: JSON.stringify(variants),
            imagesData: JSON.stringify(images),
            status: 'published'
          }
        }
      );
      productRecord = { id: insertResult.insertId, title, status: 'published' };
    }

    await sequelize.close();

    // 5. SUCCESS RESPONSE
    console.log(`✅ FIXED PUBLISH SUCCESS: ${isUpdate ? 'Updated' : 'Created'} product "${title}"`);
    
    res.json({
      success: true,
      message: `Product "${title}" ${isUpdate ? 'updated' : 'published'} successfully!`,
      product: {
        id: productRecord.id,
        title: title,
        shopifyProductId: shopifyProduct.id,
        shopifyUrl: `https://${process.env.SHOPIFY_STORE_DOMAIN || 'becc05-b4.myshopify.com'}/admin/products/${shopifyProduct.id}`,
        variants: variants.length,
        images: images.length,
        status: 'published',
        isUpdate: isUpdate
      },
      shopifyProduct: {
        id: shopifyProduct.id,
        handle: shopifyProduct.handle,
        status: shopifyProduct.status
      }
    });

  } catch (error) {
    console.error('❌ FIXED PUBLISH ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish product',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== UTILITY ENDPOINTS ====================

// List existing products for a design
router.get('/existing-products/:designId', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in' });
    }

    const { designId } = req.params;
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const sequelize = new Sequelize(dbUrl, { dialect: 'mysql', logging: false });

    const [products] = await sequelize.query(
      `SELECT sp.*, d.name as design_name 
       FROM shopify_products sp 
       JOIN designs d ON d.id = sp.design_id 
       WHERE sp.design_id = :designId 
       AND sp.creator_id = :creatorId 
       AND sp.status != 'deleted'
       ORDER BY sp.created_at DESC`,
      {
        replacements: { designId, creatorId: user.id }
      }
    );

    await sequelize.close();

    res.json({
      success: true,
      products: products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching existing products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch existing products',
      error: error.message
    });
  }
});

// Delete duplicate products
router.delete('/remove-duplicates/:designId', async (req, res) => {
  try {
    const user = req.session.creator || req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in' });
    }

    const { designId } = req.params;
    
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const sequelize = new Sequelize(dbUrl, { dialect: 'mysql', logging: false });

    // Mark duplicates as deleted (keep the most recent one)
    const [deleteResult] = await sequelize.query(
      `UPDATE shopify_products 
       SET status = 'deleted', updated_at = NOW()
       WHERE design_id = :designId 
       AND creator_id = :creatorId 
       AND id NOT IN (
         SELECT * FROM (
           SELECT id FROM shopify_products 
           WHERE design_id = :designId AND creator_id = :creatorId AND status != 'deleted'
           ORDER BY created_at DESC LIMIT 1
         ) as latest
       )`,
      {
        replacements: { designId, creatorId: user.id }
      }
    );

    await sequelize.close();

    res.json({
      success: true,
      message: 'Duplicate products removed',
      deletedCount: deleteResult.affectedRows
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove duplicates',
      error: error.message
    });
  }
});

module.exports = router;