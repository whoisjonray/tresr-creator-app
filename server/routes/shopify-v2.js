const express = require('express');
const router = express.Router();
const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');
const auth = require('../middleware/auth');
const database = require('../services/database');

// Initialize Shopify API client
let shopify;
let shopifyClient;

const initShopify = () => {
  if (!shopify) {
    shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: [
        'read_products', 
        'write_products', 
        'read_customers', 
        'write_customers', 
        'read_orders',
        'write_orders',
        'read_product_listings',
        'write_product_listings'
      ],
      hostName: process.env.HOST || 'creators.tresr.com',
      apiVersion: ApiVersion.January24,
    });
  }
  
  if (!shopifyClient) {
    shopifyClient = new shopify.clients.Rest({
      session: {
        shop: process.env.SHOPIFY_STORE_DOMAIN || 'becc05-b4.myshopify.com',
        accessToken: process.env.SHOPIFY_API_ACCESS_TOKEN
      }
    });
  }
  
  return shopifyClient;
};

// Helper function to create metafields
const createMetafields = (creatorId, commissionRate = 40) => {
  return [
    {
      namespace: 'tresr',
      key: 'creator_id',
      value: creatorId.toString(),
      type: 'single_line_text_field'
    },
    {
      namespace: 'tresr',
      key: 'commission_rate',
      value: commissionRate.toString(),
      type: 'number_decimal'
    },
    {
      namespace: 'tresr',
      key: 'created_by_system',
      value: 'tresr_creator_app',
      type: 'single_line_text_field'
    },
    {
      namespace: 'tresr',
      key: 'creation_timestamp',
      value: new Date().toISOString(),
      type: 'date_time'
    }
  ];
};

// Helper function to format product data for Shopify
const formatProductData = (designData, creatorId, commissionRate = 40) => {
  const {
    title,
    description,
    images = [],
    variants = [],
    tags = [],
    vendor = 'TRESR',
    productType = 'Apparel',
    handle
  } = designData;

  return {
    title: title || 'TRESR Design Product',
    body_html: description || '',
    vendor,
    product_type: productType,
    handle: handle || title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    tags: [...tags, 'tresr-creator', `creator-${creatorId}`].join(','),
    images: images.map((img, index) => ({
      src: img.url || img,
      alt: img.alt || `${title} - Image ${index + 1}`,
      position: index + 1
    })),
    variants: variants.length ? variants.map(variant => ({
      title: variant.title || 'Default Title',
      price: variant.price || '22.00',
      sku: variant.sku || '',
      inventory_quantity: variant.inventory_quantity || 0,
      inventory_management: variant.inventory_management || null,
      inventory_policy: variant.inventory_policy || 'deny',
      fulfillment_service: variant.fulfillment_service || 'manual',
      requires_shipping: variant.requires_shipping !== false,
      taxable: variant.taxable !== false,
      weight: variant.weight || 0,
      weight_unit: variant.weight_unit || 'lb',
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3
    })) : [{
      title: 'Default Title',
      price: '22.00',
      inventory_quantity: 0,
      inventory_management: null,
      inventory_policy: 'deny',
      fulfillment_service: 'manual',
      requires_shipping: true,
      taxable: true,
      weight: 0.5,
      weight_unit: 'lb'
    }],
    options: designData.options || [
      {
        name: 'Title',
        values: ['Default Title']
      }
    ],
    metafields: createMetafields(creatorId, commissionRate),
    status: 'draft' // Start as draft for review
  };
};

// Helper function to create SuperProduct with multiple variants
const formatSuperProductData = (designData, creatorId, commissionRate = 40) => {
  const {
    title,
    description,
    baseImages = [],
    garmentVariants = [],
    colorOptions = [],
    sizeOptions = [],
    tags = [],
    vendor = 'TRESR'
  } = designData;

  // Generate all possible variants from garments, colors, and sizes
  const variants = [];
  let variantId = 1;

  garmentVariants.forEach(garment => {
    colorOptions.forEach(color => {
      sizeOptions.forEach(size => {
        variants.push({
          title: `${garment.name} - ${color.name} - ${size}`,
          price: garment.basePrice || '22.00',
          sku: `${garment.sku || 'TRESR'}-${color.code}-${size}`,
          inventory_quantity: 0,
          inventory_management: null,
          inventory_policy: 'deny',
          fulfillment_service: 'manual',
          requires_shipping: true,
          taxable: true,
          weight: garment.weight || 0.5,
          weight_unit: 'lb',
          option1: garment.name,
          option2: color.name,
          option3: size,
          image_id: null // Will be set after images are created
        });
        variantId++;
      });
    });
  });

  return {
    title: title || 'TRESR SuperProduct',
    body_html: description || '',
    vendor,
    product_type: 'Apparel',
    handle: (title || 'tresr-superproduct').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    tags: [...tags, 'tresr-creator', `creator-${creatorId}`, 'superproduct'].join(','),
    images: baseImages.map((img, index) => ({
      src: img.url || img,
      alt: img.alt || `${title} - Image ${index + 1}`,
      position: index + 1
    })),
    variants,
    options: [
      {
        name: 'Garment',
        values: garmentVariants.map(g => g.name)
      },
      {
        name: 'Color',
        values: colorOptions.map(c => c.name)
      },
      {
        name: 'Size',
        values: sizeOptions
      }
    ],
    metafields: [
      ...createMetafields(creatorId, commissionRate),
      {
        namespace: 'tresr',
        key: 'product_type',
        value: 'superproduct',
        type: 'single_line_text_field'
      },
      {
        namespace: 'tresr',
        key: 'garment_count',
        value: garmentVariants.length.toString(),
        type: 'number_integer'
      }
    ],
    status: 'draft'
  };
};

// POST /api/shopify/products/create - Create product from design
router.post('/products/create', auth, async (req, res) => {
  try {
    const { designData, creatorId, commissionRate } = req.body;

    if (!designData || !creatorId) {
      return res.status(400).json({
        error: 'Missing required fields: designData and creatorId'
      });
    }

    const client = initShopify();
    const productData = formatProductData(designData, creatorId, commissionRate);

    // Create product in Shopify
    const response = await client.post({
      path: 'products',
      data: { product: productData }
    });

    const product = response.body.product;

    // Log product creation in database
    const db = await database.init();
    await db.run(`
      INSERT INTO shopify_products (
        shopify_id, creator_id, title, handle, status, commission_rate, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      product.id,
      creatorId,
      product.title,
      product.handle,
      product.status,
      commissionRate || 40,
      new Date().toISOString()
    ]);

    res.json({
      success: true,
      product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    });
  }
});

// POST /api/shopify/products/superproduct - Create SuperProduct with variants
router.post('/products/superproduct', auth, async (req, res) => {
  try {
    const { designData, creatorId, commissionRate } = req.body;

    if (!designData || !creatorId) {
      return res.status(400).json({
        error: 'Missing required fields: designData and creatorId'
      });
    }

    const client = initShopify();
    const superProductData = formatSuperProductData(designData, creatorId, commissionRate);

    // Create SuperProduct in Shopify
    const response = await client.post({
      path: 'products',
      data: { product: superProductData }
    });

    const product = response.body.product;

    // Log SuperProduct creation in database
    const db = await database.init();
    await db.run(`
      INSERT INTO shopify_products (
        shopify_id, creator_id, title, handle, status, commission_rate, 
        is_superproduct, variant_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product.id,
      creatorId,
      product.title,
      product.handle,
      product.status,
      commissionRate || 40,
      1, // is_superproduct
      product.variants.length,
      new Date().toISOString()
    ]);

    res.json({
      success: true,
      product,
      variantCount: product.variants.length,
      message: 'SuperProduct created successfully'
    });

  } catch (error) {
    console.error('Error creating SuperProduct:', error);
    res.status(500).json({
      error: 'Failed to create SuperProduct',
      details: error.message
    });
  }
});

// PUT /api/shopify/products/:id - Update product
router.put('/products/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { updates, creatorId } = req.body;

    if (!updates) {
      return res.status(400).json({
        error: 'Missing updates data'
      });
    }

    // Verify creator ownership
    const db = await database.init();
    const productRecord = await db.get(`
      SELECT * FROM shopify_products WHERE shopify_id = ? AND creator_id = ?
    `, [id, creatorId]);

    if (!productRecord) {
      return res.status(403).json({
        error: 'Product not found or access denied'
      });
    }

    const client = initShopify();

    // Update product in Shopify
    const response = await client.put({
      path: `products/${id}`,
      data: { product: updates }
    });

    const product = response.body.product;

    // Update database record
    await db.run(`
      UPDATE shopify_products 
      SET title = ?, status = ?, updated_at = ?
      WHERE shopify_id = ?
    `, [
      product.title,
      product.status,
      new Date().toISOString(),
      id
    ]);

    res.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Failed to update product',
      details: error.message
    });
  }
});

// DELETE /api/shopify/products/:id - Delete product
router.delete('/products/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId } = req.body;

    // Verify creator ownership
    const db = await database.init();
    const productRecord = await db.get(`
      SELECT * FROM shopify_products WHERE shopify_id = ? AND creator_id = ?
    `, [id, creatorId]);

    if (!productRecord) {
      return res.status(403).json({
        error: 'Product not found or access denied'
      });
    }

    const client = initShopify();

    // Delete product from Shopify
    await client.delete({
      path: `products/${id}`
    });

    // Mark as deleted in database (soft delete)
    await db.run(`
      UPDATE shopify_products 
      SET status = 'deleted', deleted_at = ?
      WHERE shopify_id = ?
    `, [new Date().toISOString(), id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      details: error.message
    });
  }
});

// POST /api/shopify/webhooks/order - Handle order webhook for commissions
router.post('/webhooks/order', async (req, res) => {
  try {
    const order = req.body;

    // Verify webhook authenticity (in production)
    // const hmac = req.get('X-Shopify-Hmac-Sha256');
    // const body = JSON.stringify(req.body, null, 0);
    // const hash = crypto.createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET).update(body, 'utf8').digest('base64');
    // if (hash !== hmac) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    console.log('Processing order webhook:', order.id);

    const db = await database.init();
    const commissionService = require('../services/commissionService');

    // Process each line item for commission calculation
    for (const lineItem of order.line_items) {
      // Check if this product has TRESR creator metafields
      const client = initShopify();
      
      try {
        // Get product metafields
        const metafieldsResponse = await client.get({
          path: `products/${lineItem.product_id}/metafields`,
          query: { namespace: 'tresr' }
        });

        const metafields = metafieldsResponse.body.metafields;
        const creatorIdField = metafields.find(m => m.key === 'creator_id');
        const commissionRateField = metafields.find(m => m.key === 'commission_rate');

        if (creatorIdField && commissionRateField) {
          const creatorId = creatorIdField.value;
          const commissionRate = parseFloat(commissionRateField.value);
          
          // Calculate commission
          const saleAmount = parseFloat(lineItem.price) * lineItem.quantity;
          const commissionAmount = (saleAmount * commissionRate) / 100;

          // Record commission in database
          await db.run(`
            INSERT INTO creator_commissions (
              creator_id, order_id, product_id, variant_id, 
              sale_amount, commission_rate, commission_amount,
              quantity, order_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            creatorId,
            order.id,
            lineItem.product_id,
            lineItem.variant_id,
            saleAmount,
            commissionRate,
            commissionAmount,
            lineItem.quantity,
            order.created_at,
            'pending',
            new Date().toISOString()
          ]);

          console.log(`Commission recorded: Creator ${creatorId}, Amount ${commissionAmount}`);
        }
      } catch (metaError) {
        console.error('Error fetching metafields for product:', lineItem.product_id, metaError);
      }
    }

    // Send success response to Shopify
    res.status(200).json({ 
      received: true,
      order_id: order.id,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing order webhook:', error);
    res.status(500).json({
      error: 'Failed to process order webhook',
      details: error.message
    });
  }
});

// GET /api/shopify/products - List products by creator
router.get('/products', auth, async (req, res) => {
  try {
    const { creatorId, status, limit = 50, page = 1 } = req.query;

    if (!creatorId) {
      return res.status(400).json({
        error: 'Missing creatorId parameter'
      });
    }

    const db = await database.init();
    let query = `
      SELECT * FROM shopify_products 
      WHERE creator_id = ? AND status != 'deleted'
    `;
    const params = [creatorId];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const products = await db.all(query, params);

    res.json({
      success: true,
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});

// GET /api/shopify/products/:id/commissions - Get commissions for a product
router.get('/products/:id/commissions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId, status, startDate, endDate } = req.query;

    const db = await database.init();
    let query = `
      SELECT * FROM creator_commissions 
      WHERE product_id = ?
    `;
    const params = [id];

    if (creatorId) {
      query += ` AND creator_id = ?`;
      params.push(creatorId);
    }

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND order_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND order_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY order_date DESC`;

    const commissions = await db.all(query, params);

    const totalCommissions = commissions.reduce((sum, c) => sum + c.commission_amount, 0);

    res.json({
      success: true,
      commissions,
      summary: {
        totalCommissions,
        totalSales: commissions.reduce((sum, c) => sum + c.sale_amount, 0),
        orderCount: commissions.length
      }
    });

  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({
      error: 'Failed to fetch commissions',
      details: error.message
    });
  }
});

module.exports = router;