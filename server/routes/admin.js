const express = require('express');
const router = express.Router();

// Mock data for admin config
const defaultConfig = {
  productTemplates: [
    { id: 'tee', name: 'Medium Weight T-Shirt', templateId: 'tshirt_front', price: 22, colors: ['Black', 'White', 'Navy', 'Heather Grey', 'Natural', 'Red'], category: 'apparel', baseImage: '/garments/tshirt-base.png' },
    { id: 'boxy', name: 'Oversized Drop Shoulder', templateId: 'tshirt_boxy_front', price: 26, colors: ['Black', 'Natural'], category: 'apparel', baseImage: '/garments/boxy-base.png' },
    { id: 'wmn-hoodie', name: "Women's Independent Hoodie", templateId: 'hoodie_front', price: 42, colors: ['Black', 'Black Camo', 'Pink', 'Bone', 'Cotton Candy', 'Gray Heather', 'Sage', 'White'], category: 'apparel', baseImage: '/garments/hoodie-base.png' },
    { id: 'med-hood', name: 'Medium Weight Hoodie', templateId: 'hoodie_front', price: 42, colors: ['Black', 'Gold', 'Gray Heather', 'Red', 'Alpine Green'], category: 'apparel', baseImage: '/garments/hoodie-base.png' },
    { id: 'patch-c', name: 'Patch Hat - Curved', templateId: 'hat_front', price: 22, colors: ['Black', 'Gray'], category: 'accessories', baseImage: '/garments/hat-base.png' },
    { id: 'art-sqm', name: 'Art Canvas - 16x16', templateId: 'canvas_square', price: 45, colors: ['White'], category: 'home', baseImage: '/garments/canvas-base.png' }
  ],
  colorPalette: [
    { name: 'Black', hex: '#000000', filterCSS: 'brightness(0.3)' },
    { name: 'White', hex: '#FFFFFF', filterCSS: 'brightness(1.2) contrast(0.8)' },
    { name: 'Navy', hex: '#000080', filterCSS: 'hue-rotate(220deg) saturate(1.5) brightness(0.4)' },
    { name: 'Red', hex: '#FF0000', filterCSS: 'hue-rotate(0deg) saturate(2) brightness(0.8)' },
    { name: 'Gray', hex: '#808080', filterCSS: 'saturate(0) brightness(0.8)' },
    { name: 'Forest Green', hex: '#228B22', filterCSS: 'hue-rotate(120deg) saturate(1.5) brightness(0.5)' },
    { name: 'Royal Blue', hex: '#4169E1', filterCSS: 'hue-rotate(210deg) saturate(2) brightness(0.6)' },
    { name: 'Orange', hex: '#FFA500', filterCSS: 'hue-rotate(30deg) saturate(2) brightness(0.9)' },
    { name: 'Yellow', hex: '#FFFF00', filterCSS: 'hue-rotate(60deg) saturate(2) brightness(1)' },
    { name: 'Pink', hex: '#FFC0CB', filterCSS: 'hue-rotate(330deg) saturate(1.2) brightness(1.1)' }
  ],
  mockupSystem: 'prerendered',
  settings: {
    maxFileSize: 5,
    allowedFileTypes: ['PNG', 'JPG', 'SVG'],
    defaultMockupSystem: 'prerendered'
  }
};

// In-memory storage for admin data (in production, use database)
let adminConfig = { ...defaultConfig };

// GET /api/admin/config
router.get('/config', (req, res) => {
  res.json(adminConfig);
});

// POST /api/admin/products
router.post('/products', (req, res) => {
  const newProduct = req.body;
  
  if (!newProduct.name || !newProduct.templateId) {
    return res.status(400).json({ error: 'Name and templateId are required' });
  }
  
  // Add product to config
  adminConfig.productTemplates.push(newProduct);
  
  res.json({ success: true, product: newProduct });
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  
  adminConfig.productTemplates = adminConfig.productTemplates.filter(p => p.id !== id);
  
  res.json({ success: true });
});

// POST /api/admin/colors
router.post('/colors', (req, res) => {
  const newColor = req.body;
  
  if (!newColor.name || !newColor.hex) {
    return res.status(400).json({ error: 'Name and hex are required' });
  }
  
  // Add color to palette
  adminConfig.colorPalette.push(newColor);
  
  res.json({ success: true, color: newColor });
});

// DELETE /api/admin/colors/:name
router.delete('/colors/:name', (req, res) => {
  const { name } = req.params;
  
  adminConfig.colorPalette = adminConfig.colorPalette.filter(c => c.name !== name);
  
  res.json({ success: true });
});

// GET /api/admin/garments/status
router.get('/garments/status', (req, res) => {
  // Mock garment status based on what we know from the migration
  const status = {
    configured: [
      { id: 'tee', name: 'Medium Weight T-Shirt', colors: 6 },
      { id: 'boxy', name: 'Oversized Drop Shoulder', colors: 2 },
      { id: 'next-crop', name: 'Next Level Crop Top', colors: 5 },
      { id: 'wmn-hoodie', name: "Women's Independent Hoodie", colors: 8 },
      { id: 'med-hood', name: 'Medium Weight Hoodie', colors: 5 },
      { id: 'mediu', name: 'Medium Weight Sweatshirt', colors: 5 },
      { id: 'patch-c', name: 'Patch Hat - Curved', colors: 2 },
      { id: 'patch-flat', name: 'Patch Hat - Flat', colors: 2 },
      { id: 'art-sqsm', name: 'Art Canvas - 12x12', colors: 1 },
      { id: 'art-sqm', name: 'Art Canvas - 16x16', colors: 1 },
      { id: 'art-lg', name: 'Art Canvas - 24x24', colors: 1 },
      { id: 'polo', name: 'Standard Polo', colors: 1 },
      { id: 'nft', name: 'NFTREASURE NFT Cards', colors: 1 }
    ],
    missing: ['snaphat', 'stckr', 'gen', 'hat', 'stdmug'],
    totalImages: 78,
    storageUsed: '~45MB',
    cdn: 'Cloudinary (Free Tier)'
  };
  
  res.json(status);
});

// POST /api/admin/garments/upload
router.post('/garments/upload', (req, res) => {
  // In a real implementation, this would handle file uploads
  res.json({ 
    success: false, 
    message: 'File upload not implemented in development mode' 
  });
});

// POST /api/admin/garments/sync
router.post('/garments/sync', (req, res) => {
  // In a real implementation, this would sync from Sanity
  res.json({ 
    success: false, 
    message: 'Sanity sync not implemented in development mode' 
  });
});

// PUT /api/admin/settings
router.put('/settings', (req, res) => {
  const updates = req.body;
  
  adminConfig.settings = {
    ...adminConfig.settings,
    ...updates
  };
  
  res.json({ success: true, settings: adminConfig.settings });
});

module.exports = router;