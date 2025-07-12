const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopify');
const { requireAuth } = require('../middleware/auth');

// Get all products for a creator
router.get('/', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    
    // Get products by vendor (creator name)
    const products = await shopifyService.getProductsByVendor(creator.name);
    
    res.json({
      success: true,
      products,
      count: products.length
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message 
    });
  }
});

// Create a new product
router.post('/', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    const { 
      title, 
      description, 
      tags, 
      variants, 
      images,
      nfcConfig 
    } = req.body;

    // Validate required fields
    if (!title || !variants || !variants.length) {
      return res.status(400).json({ 
        error: 'Title and variants are required' 
      });
    }

    // Create product data
    const productData = {
      title,
      body_html: description || '',
      vendor: creator.name,
      tags: [
        ...tags,
        `creator:${creator.name.toLowerCase().replace(/\s+/g, '-')}`,
        'creator-product'
      ].join(', '),
      variants: variants.map(variant => ({
        ...variant,
        inventory_quantity: 999, // POD unlimited inventory
        inventory_management: null,
        fulfillment_service: 'manual'
      })),
      images,
      metafields: [
        {
          namespace: 'tresr',
          key: 'creator_id',
          value: creator.id,
          type: 'single_line_text_field'
        },
        {
          namespace: 'tresr',
          key: 'commission_rate',
          value: '40',
          type: 'number_integer'
        }
      ]
    };

    // Add NFC config if provided
    if (nfcConfig) {
      productData.metafields.push({
        namespace: 'tresr',
        key: 'nfc_config',
        value: JSON.stringify(nfcConfig),
        type: 'json'
      });
    }

    // Create product in Shopify
    const product = await shopifyService.createProduct(productData);

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      message: error.message 
    });
  }
});

// Update a product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    const { id } = req.params;
    const updates = req.body;

    // Verify creator owns this product
    const product = await shopifyService.getProduct(id);
    if (product.vendor !== creator.name) {
      return res.status(403).json({ 
        error: 'You do not have permission to edit this product' 
      });
    }

    // Update product
    const updatedProduct = await shopifyService.updateProduct(id, updates);

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      message: error.message 
    });
  }
});

// Delete a product
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    const { id } = req.params;

    // Verify creator owns this product
    const product = await shopifyService.getProduct(id);
    if (product.vendor !== creator.name) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this product' 
      });
    }

    // Delete product
    await shopifyService.deleteProduct(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      message: error.message 
    });
  }
});

// Get product templates (garment types)
router.get('/templates', requireAuth, async (req, res) => {
  try {
    // Return available product templates
    const templates = [
      {
        id: 'classic-tee',
        name: 'Classic T-Shirt',
        basePrice: 22.00,
        printArea: { width: 4200, height: 4800 },
        colors: ['black', 'white', 'navy', 'red', 'gray'],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
      },
      {
        id: 'hoodie',
        name: 'Pullover Hoodie',
        basePrice: 42.00,
        printArea: { width: 4200, height: 4800 },
        colors: ['black', 'white', 'navy', 'gray'],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
      },
      {
        id: 'tank-top',
        name: 'Tank Top',
        basePrice: 20.00,
        printArea: { width: 3600, height: 4800 },
        colors: ['black', 'white', 'navy', 'red'],
        sizes: ['S', 'M', 'L', 'XL', '2XL']
      },
      {
        id: 'long-sleeve',
        name: 'Long Sleeve Tee',
        basePrice: 26.00,
        printArea: { width: 4200, height: 4800 },
        colors: ['black', 'white', 'navy', 'gray'],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL']
      }
    ];

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message 
    });
  }
});

module.exports = router;