// Garment Image Configuration
// Update these paths to point to your actual TRESR.com garment images

// If your images are hosted on a CDN (like Cloudinary), update the base URL
const IMAGE_BASE_URL = process.env.REACT_APP_GARMENT_IMAGE_BASE_URL || '';

// Helper function to build full image URLs
const buildImageUrl = (path) => {
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path}`;
};

// Pre-rendered garment images from TRESR.com
export const GARMENT_IMAGES = {
  'classic-tee': {
    'Black': buildImageUrl('/garments/classic-tee/black.jpg'),
    'White': buildImageUrl('/garments/classic-tee/white.jpg'),
    'Navy': buildImageUrl('/garments/classic-tee/navy.jpg'),
    'Red': buildImageUrl('/garments/classic-tee/red.jpg'),
    'Gray': buildImageUrl('/garments/classic-tee/gray.jpg'),
    'Heather Gray': buildImageUrl('/garments/classic-tee/heather-gray.jpg'),
    'Forest Green': buildImageUrl('/garments/classic-tee/forest-green.jpg'),
    'Royal Blue': buildImageUrl('/garments/classic-tee/royal-blue.jpg'),
    'Orange': buildImageUrl('/garments/classic-tee/orange.jpg'),
    'Yellow': buildImageUrl('/garments/classic-tee/yellow.jpg'),
    'Pink': buildImageUrl('/garments/classic-tee/pink.jpg'),
    'Purple': buildImageUrl('/garments/classic-tee/purple.jpg'),
    'Maroon': buildImageUrl('/garments/classic-tee/maroon.jpg'),
    'Light Blue': buildImageUrl('/garments/classic-tee/light-blue.jpg'),
    'Kelly Green': buildImageUrl('/garments/classic-tee/kelly-green.jpg'),
    'Charcoal': buildImageUrl('/garments/classic-tee/charcoal.jpg'),
    'Brown': buildImageUrl('/garments/classic-tee/brown.jpg'),
    'Olive': buildImageUrl('/garments/classic-tee/olive.jpg')
  },
  
  'premium-tee': {
    'Black': buildImageUrl('/garments/premium-tee/black.jpg'),
    'White': buildImageUrl('/garments/premium-tee/white.jpg'),
    'Navy': buildImageUrl('/garments/premium-tee/navy.jpg'),
    'Gray': buildImageUrl('/garments/premium-tee/gray.jpg'),
    'Red': buildImageUrl('/garments/premium-tee/red.jpg')
  },
  
  'hoodie': {
    'Black': buildImageUrl('/garments/hoodie/black.jpg'),
    'White': buildImageUrl('/garments/hoodie/white.jpg'),
    'Navy': buildImageUrl('/garments/hoodie/navy.jpg'),
    'Red': buildImageUrl('/garments/hoodie/red.jpg'),
    'Gray': buildImageUrl('/garments/hoodie/gray.jpg'),
    'Heather Gray': buildImageUrl('/garments/hoodie/heather-gray.jpg'),
    'Royal Blue': buildImageUrl('/garments/hoodie/royal-blue.jpg'),
    'Forest Green': buildImageUrl('/garments/hoodie/forest-green.jpg'),
    'Maroon': buildImageUrl('/garments/hoodie/maroon.jpg')
  },
  
  'crewneck': {
    'Black': buildImageUrl('/garments/crewneck/black.jpg'),
    'White': buildImageUrl('/garments/crewneck/white.jpg'),
    'Navy': buildImageUrl('/garments/crewneck/navy.jpg'),
    'Gray': buildImageUrl('/garments/crewneck/gray.jpg'),
    'Red': buildImageUrl('/garments/crewneck/red.jpg'),
    'Forest Green': buildImageUrl('/garments/crewneck/forest-green.jpg'),
    'Royal Blue': buildImageUrl('/garments/crewneck/royal-blue.jpg')
  },
  
  'long-sleeve': {
    'Black': buildImageUrl('/garments/long-sleeve/black.jpg'),
    'White': buildImageUrl('/garments/long-sleeve/white.jpg'),
    'Navy': buildImageUrl('/garments/long-sleeve/navy.jpg'),
    'Gray': buildImageUrl('/garments/long-sleeve/gray.jpg'),
    'Red': buildImageUrl('/garments/long-sleeve/red.jpg')
  },
  
  'tank': {
    'Black': buildImageUrl('/garments/tank/black.jpg'),
    'White': buildImageUrl('/garments/tank/white.jpg'),
    'Gray': buildImageUrl('/garments/tank/gray.jpg'),
    'Navy': buildImageUrl('/garments/tank/navy.jpg'),
    'Red': buildImageUrl('/garments/tank/red.jpg'),
    'Royal Blue': buildImageUrl('/garments/tank/royal-blue.jpg')
  },
  
  'mug': {
    'White': buildImageUrl('/garments/mug/white.jpg'),
    'Black': buildImageUrl('/garments/mug/black.jpg'),
    'Navy': buildImageUrl('/garments/mug/navy.jpg'),
    'Red': buildImageUrl('/garments/mug/red.jpg'),
    'Two-Tone Black': buildImageUrl('/garments/mug/two-tone-black.jpg'),
    'Two-Tone Red': buildImageUrl('/garments/mug/two-tone-red.jpg'),
    'Two-Tone Blue': buildImageUrl('/garments/mug/two-tone-blue.jpg')
  },
  
  'phone-case': {
    'Black': buildImageUrl('/garments/phone-case/black.jpg'),
    'Clear': buildImageUrl('/garments/phone-case/clear.jpg'),
    'White': buildImageUrl('/garments/phone-case/white.jpg'),
    'Navy': buildImageUrl('/garments/phone-case/navy.jpg'),
    'Pink': buildImageUrl('/garments/phone-case/pink.jpg')
  },
  
  'sticker': {
    'White': buildImageUrl('/garments/sticker/white.jpg'),
    'Clear': buildImageUrl('/garments/sticker/clear.jpg'),
    'Holographic': buildImageUrl('/garments/sticker/holographic.jpg')
  },
  
  'tote': {
    'Natural': buildImageUrl('/garments/tote/natural.jpg'),
    'Black': buildImageUrl('/garments/tote/black.jpg'),
    'Navy': buildImageUrl('/garments/tote/navy.jpg'),
    'Red': buildImageUrl('/garments/tote/red.jpg')
  },
  
  'poster': {
    'White': buildImageUrl('/garments/poster/white.jpg'),
    'Black': buildImageUrl('/garments/poster/black.jpg')
  },
  
  'hat': {
    'Black': buildImageUrl('/garments/hat/black.jpg'),
    'White': buildImageUrl('/garments/hat/white.jpg'),
    'Navy': buildImageUrl('/garments/hat/navy.jpg'),
    'Gray': buildImageUrl('/garments/hat/gray.jpg'),
    'Red': buildImageUrl('/garments/hat/red.jpg'),
    'Khaki': buildImageUrl('/garments/hat/khaki.jpg')
  }
};

// Fallback images for each garment type
export const GARMENT_FALLBACKS = {
  'classic-tee': buildImageUrl('/garments/classic-tee/white.jpg'),
  'premium-tee': buildImageUrl('/garments/premium-tee/white.jpg'),
  'hoodie': buildImageUrl('/garments/hoodie/gray.jpg'),
  'crewneck': buildImageUrl('/garments/crewneck/gray.jpg'),
  'long-sleeve': buildImageUrl('/garments/long-sleeve/white.jpg'),
  'tank': buildImageUrl('/garments/tank/white.jpg'),
  'mug': buildImageUrl('/garments/mug/white.jpg'),
  'phone-case': buildImageUrl('/garments/phone-case/black.jpg'),
  'sticker': buildImageUrl('/garments/sticker/white.jpg'),
  'tote': buildImageUrl('/garments/tote/natural.jpg'),
  'poster': buildImageUrl('/garments/poster/white.jpg'),
  'hat': buildImageUrl('/garments/hat/black.jpg')
};

// Design positioning for each garment type
export const DESIGN_POSITIONS = {
  'classic-tee': { 
    top: '35%', 
    left: '50%', 
    scale: 0.8, 
    maxWidth: '200px' 
  },
  'premium-tee': { 
    top: '35%', 
    left: '50%', 
    scale: 0.8, 
    maxWidth: '200px' 
  },
  'hoodie': { 
    top: '40%', 
    left: '50%', 
    scale: 0.75, 
    maxWidth: '180px' 
  },
  'crewneck': { 
    top: '38%', 
    left: '50%', 
    scale: 0.75, 
    maxWidth: '180px' 
  },
  'long-sleeve': { 
    top: '35%', 
    left: '50%', 
    scale: 0.8, 
    maxWidth: '200px' 
  },
  'tank': { 
    top: '35%', 
    left: '50%', 
    scale: 0.8, 
    maxWidth: '180px' 
  },
  'mug': { 
    top: '45%', 
    left: '48%', 
    scale: 0.6, 
    maxWidth: '120px', 
    transform: 'rotateY(-8deg)' 
  },
  'phone-case': { 
    top: '50%', 
    left: '50%', 
    scale: 0.7, 
    maxWidth: '140px' 
  },
  'sticker': { 
    top: '50%', 
    left: '50%', 
    scale: 0.9, 
    maxWidth: '200px' 
  },
  'tote': { 
    top: '45%', 
    left: '50%', 
    scale: 0.6, 
    maxWidth: '160px' 
  },
  'poster': { 
    top: '50%', 
    left: '50%', 
    scale: 0.95, 
    maxWidth: '280px' 
  },
  'hat': { 
    top: '45%', 
    left: '50%', 
    scale: 0.5, 
    maxWidth: '100px' 
  }
};

// Get available colors for a specific garment type
export const getAvailableColors = (garmentType) => {
  const garment = GARMENT_IMAGES[garmentType];
  return garment ? Object.keys(garment) : [];
};

// Check if a specific color is available for a garment type
export const isColorAvailable = (garmentType, color) => {
  return GARMENT_IMAGES[garmentType]?.[color] !== undefined;
};

// Get the image URL for a specific garment/color combo
export const getGarmentImage = (garmentType, color) => {
  // First try exact match
  if (GARMENT_IMAGES[garmentType]?.[color]) {
    return GARMENT_IMAGES[garmentType][color];
  }
  
  // Return fallback for that garment type
  return GARMENT_FALLBACKS[garmentType] || GARMENT_FALLBACKS['classic-tee'];
};