/**
 * TRESR Branded Blanks Garment Images Configuration
 * All images uploaded from TRESR Branded Blanks - New folder
 * Images are stored in the 'tresr-garments' folder on Cloudinary
 * URL pattern: https://res.cloudinary.com/dqslerzk9/image/upload/tresr-garments/{productId}_{color}_{side}.{format}
 * 
 * Generated: 2025-07-13
 */

const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/dqslerzk9/image/upload/tresr-garments';

export const TRESR_BRANDED_BLANKS = {
  // Oversized Drop Shoulder (Complete Front & Back)
  'boxy': {
    name: 'Oversized Drop Shoulder',
    sku: 'BOXY',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/boxy_black_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_black_back.jpg`
      },
      'cardinal-red': {
        name: 'Cardinal Red',
        front: `${CLOUDINARY_BASE_URL}/boxy_cardinal-red_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_cardinal-red_back.jpg`
      },
      'heather-grey': {
        name: 'Heather Grey',
        front: `${CLOUDINARY_BASE_URL}/boxy_heather-grey_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_heather-grey_back.jpg`
      },
      'natural': {
        name: 'Natural',
        front: `${CLOUDINARY_BASE_URL}/boxy_natural_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_natural_back.jpg`
      },
      'navy': {
        name: 'Navy',
        front: `${CLOUDINARY_BASE_URL}/boxy_navy_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_navy_back.jpg`
      },
      'white': {
        name: 'White',
        front: `${CLOUDINARY_BASE_URL}/boxy_white_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/boxy_white_back.jpg`
      }
    }
  },
  
  // Next Level Crop Top (Complete Front & Back)
  'next-crop': {
    name: 'Next Level Crop Top',
    sku: 'NEXT-CROP',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/next-crop_black_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/next-crop_black_back.jpg`
      },
      'white': {
        name: 'White',
        front: `${CLOUDINARY_BASE_URL}/next-crop_white_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/next-crop_white_back.jpg`
      },
      'grey-heather': {
        name: 'Grey Heather',
        front: `${CLOUDINARY_BASE_URL}/next-crop_grey-heather_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/next-crop_grey-heather_back.jpg`
      },
      'midnight-navy': {
        name: 'Midnight Navy',
        front: `${CLOUDINARY_BASE_URL}/next-crop_midnight-navy_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/next-crop_midnight-navy_back.jpg`
      },
      'red': {
        name: 'Red',
        front: `${CLOUDINARY_BASE_URL}/next-crop_red_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/next-crop_red_back.jpg`
      }
    }
  },
  
  // Standard Polo (Front only - back images not available)
  'polo': {
    name: 'Standard Polo',
    sku: 'POLO',
    colors: {
      'black': {
        name: 'Deep Black',
        front: `${CLOUDINARY_BASE_URL}/polo_black_front.jpg`,
        back: null
      },
      'white': {
        name: 'White',
        front: `${CLOUDINARY_BASE_URL}/polo_white_front.jpg`,
        back: null
      },
      'navy': {
        name: 'River Blue Navy',
        front: `${CLOUDINARY_BASE_URL}/polo_navy_front.jpg`,
        back: null
      },
      'red': {
        name: 'Rich Red',
        front: `${CLOUDINARY_BASE_URL}/polo_red_front.jpg`,
        back: null
      },
      'graphite': {
        name: 'Graphite',
        front: `${CLOUDINARY_BASE_URL}/polo_graphite_front.jpg`,
        back: null
      }
    }
  },
  
  // Medium Weight Sweatshirt (Complete Front & Back)
  'mediu': {
    name: 'Medium Weight Sweatshirt',
    sku: 'MEDIU',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/mediu_black_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/mediu_black_back.png`
      },
      'white': {
        name: 'White',
        front: `${CLOUDINARY_BASE_URL}/mediu_white_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/mediu_white_back.png`
      },
      'navy': {
        name: 'Classic Navy',
        front: `${CLOUDINARY_BASE_URL}/mediu_navy_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/mediu_navy_back.png`
      },
      'red': {
        name: 'Red',
        front: `${CLOUDINARY_BASE_URL}/mediu_red_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/mediu_red_back.png`
      },
      'grey-heather': {
        name: 'Grey Heather',
        front: `${CLOUDINARY_BASE_URL}/mediu_grey-heather_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/mediu_grey-heather_back.png`
      }
    }
  },
  
  // Medium Weight T-Shirt (Back only - front images missing)
  'tee': {
    name: 'Medium Weight T-Shirt',
    sku: 'TEE',
    colors: {
      'black': {
        name: 'Black',
        front: null,
        back: `${CLOUDINARY_BASE_URL}/tee_black_back.jpg`
      },
      'cardinal-red': {
        name: 'Cardinal Red',
        front: null,
        back: `${CLOUDINARY_BASE_URL}/tee_cardinal-red_back.jpg`
      },
      'dark-heather-grey': {
        name: 'Dark Heather Grey',
        front: null,
        back: `${CLOUDINARY_BASE_URL}/tee_dark-heather-grey_back.jpg`
      }
    }
  },
  
  // Medium Weight Hoodie (Most complete except black back)
  'med-hood': {
    name: 'Medium Weight Hoodie',
    sku: 'MED-HOOD',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/med-hood_black_front.jpg`,
        back: null // Missing from source
      },
      'white': {
        name: 'White',
        front: `${CLOUDINARY_BASE_URL}/med-hood_white_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/med-hood_white_back.png`
      },
      'gold': {
        name: 'Gold',
        front: `${CLOUDINARY_BASE_URL}/med-hood_gold_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/med-hood_gold_back.png`
      },
      'red': {
        name: 'Red',
        front: `${CLOUDINARY_BASE_URL}/med-hood_red_front.jpg`,
        back: null // Not uploaded yet
      },
      'navy': {
        name: 'Classic Navy',
        front: `${CLOUDINARY_BASE_URL}/med-hood_navy_front.jpg`,
        back: `${CLOUDINARY_BASE_URL}/med-hood_navy_back.png`
      }
    }
  },
  
  // Patch Hat - Curved (Front only)
  'patch-c': {
    name: 'Patch Hat - Curved',
    sku: 'PATCH-C',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/patch-c_black_front.jpg`,
        back: null
      },
      'grey': {
        name: 'Grey',
        front: `${CLOUDINARY_BASE_URL}/patch-c_grey_front.jpg`,
        back: null
      }
    }
  },
  
  // Patch Hat - Flat (Front only)
  'patch-flat': {
    name: 'Patch Hat - Flat',
    sku: 'PATCH-FLAT',
    colors: {
      'black': {
        name: 'Black',
        front: `${CLOUDINARY_BASE_URL}/patch-flat_black_front.jpg`,
        back: null
      },
      'navy': {
        name: 'Navy',
        front: `${CLOUDINARY_BASE_URL}/patch-flat_navy_front.jpg`,
        back: null
      }
    }
  }
};

/**
 * Helper function to get garment image URL
 * @param {string} productId - Product identifier (e.g., 'boxy', 'next-crop')
 * @param {string} colorSlug - Color slug (e.g., 'black', 'cardinal-red')
 * @param {string} side - 'front' or 'back'
 * @returns {string|null} - Cloudinary URL or null if not available
 */
export function getTRESRGarmentImage(productId, colorSlug, side = 'front') {
  const product = TRESR_BRANDED_BLANKS[productId];
  if (!product || !product.colors[colorSlug]) return null;
  
  return product.colors[colorSlug][side] || null;
}

/**
 * Get all available colors for a product
 * @param {string} productId - Product identifier
 * @returns {Array} - Array of color objects with slug and name
 */
export function getTRESRProductColors(productId) {
  const product = TRESR_BRANDED_BLANKS[productId];
  if (!product) return [];
  
  return Object.entries(product.colors).map(([slug, data]) => ({
    slug,
    name: data.name,
    hasFront: !!data.front,
    hasBack: !!data.back
  }));
}

/**
 * Get product info
 * @param {string} productId - Product identifier
 * @returns {Object|null} - Product info or null
 */
export function getTRESRProductInfo(productId) {
  const product = TRESR_BRANDED_BLANKS[productId];
  if (!product) return null;
  
  return {
    id: productId,
    name: product.name,
    sku: product.sku,
    colorCount: Object.keys(product.colors).length,
    hasCompleteSet: Object.values(product.colors).every(c => c.front && c.back)
  };
}

// Export all available product IDs
export const TRESR_PRODUCT_IDS = Object.keys(TRESR_BRANDED_BLANKS);

// Export priority products (with most complete image sets)
export const TRESR_PRIORITY_PRODUCTS = ['boxy', 'next-crop', 'mediu', 'polo'];

// Summary stats
export const TRESR_UPLOAD_STATS = {
  totalProducts: 8,
  totalImagesUploaded: 56, // 42 from first run + 14 from back images
  completeProducts: ['boxy', 'next-crop', 'mediu'], // Both front and back for all colors
  partialProducts: ['polo', 'tee', 'med-hood', 'patch-c', 'patch-flat'],
  missingImages: [
    'polo - all back images',
    'tee - all front images', 
    'med-hood - black back',
    'med-hood - red back'
  ]
};