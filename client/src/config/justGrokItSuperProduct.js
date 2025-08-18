/**
 * Just Grok It SuperProduct Configuration
 * Hardcoded configuration for the first working end-to-end design
 */

export const justGrokItConfig = {
  id: 'just-grok-it-complete',
  title: 'Just Grok It - Complete Collection',
  description: 'AI-inspired design perfect for tech enthusiasts and philosophy lovers. Available on premium garments.',
  designId: 'b389d0a0-932c-4d14-9ab0-8e29057af06e',
  designImage: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/kf2qj444lehxktpzdmkw.png',
  backDesignImage: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1740958348/designs/k2r2aa8vmghuyr3he0p2eo5e/zsk8gw3lcyl6af6fxyg1.png',
  
  // Design positioning for each garment type
  printAreas: {
    tee: {
      front: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 },
      back: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 }
    },
    'baby-tee': {
      front: { x: 0.5, y: 0.42, width: 0.32, height: 0.38, scale: 0.75 },
      back: { x: 0.5, y: 0.42, width: 0.32, height: 0.38, scale: 0.75 }
    },
    'boxy': {
      front: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 },
      back: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 }
    },
    'next-crop': {
      front: { x: 0.5, y: 0.48, width: 0.3, height: 0.35, scale: 0.7 },
      back: { x: 0.5, y: 0.48, width: 0.3, height: 0.35, scale: 0.7 }
    },
    'med-hood': {
      front: { x: 0.5, y: 0.52, width: 0.32, height: 0.38, scale: 0.75 },
      back: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 }
    },
    'mediu': {
      front: { x: 0.5, y: 0.5, width: 0.35, height: 0.4, scale: 0.8 },
      back: { x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8 }
    }
  },
  
  options: {
    fit: {
      label: 'Fit',
      values: ['Male', 'Female']
    },
    style: {
      label: 'Style',
      values: {
        male: [
          {
            id: 'tee',
            name: 'Classic T-Shirt',
            price: '22.00',
            colors: ['black', 'white', 'navy'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Medium weight cotton t-shirt, perfect for everyday wear',
            cloudinaryBase: 'tresr-garments/tee'
          },
          {
            id: 'boxy',
            name: 'Oversized Drop Shoulder',
            price: '28.00',
            colors: ['black', 'natural'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Relaxed fit oversized t-shirt with drop shoulders',
            cloudinaryBase: 'tresr-garments/boxy'
          },
          {
            id: 'med-hood',
            name: 'Hoodie',
            price: '45.00',
            colors: ['black', 'white', 'navy'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Medium weight pullover hoodie with front pocket',
            cloudinaryBase: 'tresr-garments/med-hood'
          },
          {
            id: 'mediu',
            name: 'Sweatshirt',
            price: '38.00',
            colors: ['black', 'white', 'navy'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Medium weight crew neck sweatshirt',
            cloudinaryBase: 'tresr-garments/mediu'
          }
        ],
        female: [
          {
            id: 'baby-tee',
            name: 'Ladies Baby Tee',
            price: '23.00',
            colors: ['black', 'white'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Fitted ladies baby tee with a feminine cut',
            cloudinaryBase: 'tresr-garments/baby-tee'
          },
          {
            id: 'next-crop',
            name: 'Crop Top',
            price: '24.00',
            colors: ['black', 'white'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Next Level women\'s ideal crop top',
            cloudinaryBase: 'tresr-garments/next-crop'
          }
        ]
      }
    }
  },

  // Related accessories (separate products)
  accessories: [
    {
      id: 'patch-c',
      name: 'Curved Hat',
      price: '25.00',
      colors: ['black'],
      description: 'Flexfit curved visor snapback with Just Grok It patch',
      cloudinaryBase: 'tresr-garments/patch-c',
      productType: 'accessory'
    }
  ],

  // Marketing copy
  marketing: {
    tagline: 'Understand it all with AI',
    benefits: [
      'Premium quality garments',
      'Unique AI-inspired design',
      'Perfect for tech enthusiasts',
      'Conversation starter',
      'Available in multiple styles'
    ],
    tags: ['AI', 'Technology', 'Philosophy', 'Grok', 'Machine Learning', 'Future']
  }
};

// Helper functions
export const getStylesForFit = (fit) => {
  if (!fit) return [];
  return justGrokItConfig.options.style.values[fit.toLowerCase()] || [];
};

export const getStyleById = (styleId) => {
  const allStyles = [
    ...justGrokItConfig.options.style.values.male,
    ...justGrokItConfig.options.style.values.female
  ];
  return allStyles.find(style => style.id === styleId);
};

export const getPrintAreaForGarment = (garmentId, side = 'front') => {
  return justGrokItConfig.printAreas[garmentId]?.[side] || {
    x: 0.5, y: 0.45, width: 0.35, height: 0.4, scale: 0.8
  };
};

export const getGarmentImageUrl = (garmentId, color, side = 'front') => {
  const style = getStyleById(garmentId);
  if (!style) return null;
  
  // Use actual Cloudinary URLs from the upload report
  const cloudinaryMapping = {
    'tee': {
      'black': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444434/tresr-garments/tee_black_front.png' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444434/tresr-garments/tee_black_back.png',
      'white': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444436/tresr-garments/tee_white_front.png' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444436/tresr-garments/tee_white_back.png',
      'navy': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444438/tresr-garments/tee_navy_front.png' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444438/tresr-garments/tee_navy_back.png'
    },
    'baby-tee': {
      'black': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1754608310/tresr-templates/tresr-templates/baby-tee/front-black.png' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1754608317/tresr-templates/tresr-templates/baby-tee/back-black.png',
      'white': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1754608329/tresr-templates/tresr-templates/baby-tee/front-white.png' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1754608335/tresr-templates/tresr-templates/baby-tee/back-white.png'
    },
    'boxy': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444370/tresr-garments/boxy_black_front.jpg',
      'natural': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444378/tresr-garments/boxy_natural_front.jpg'
    },
    'next-crop': {
      'black': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444384/tresr-garments/next-crop_black_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444386/tresr-garments/next-crop_black_back.jpg',
      'white': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444388/tresr-garments/next-crop_white_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444391/tresr-garments/next-crop_white_back.jpg'
    },
    'med-hood': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444442/tresr-garments/med-hood_black_front.png',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444444/tresr-garments/med-hood_white_front.png',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444453/tresr-garments/med-hood_navy_front.png'
    },
    'mediu': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444420/tresr-garments/mediu_black_front.png',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444423/tresr-garments/mediu_white_front.png',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444425/tresr-garments/mediu_navy_front.png'
    }
  };

  return cloudinaryMapping[garmentId]?.[color] || null;
};

export const getTotalVariants = () => {
  const maleStyles = justGrokItConfig.options.style.values.male;
  const femaleStyles = justGrokItConfig.options.style.values.female;
  
  let total = 0;
  [...maleStyles, ...femaleStyles].forEach(style => {
    total += style.colors.length * style.sizes.length;
  });
  
  return total;
};

export const getSummaryStats = () => {
  const maleStyles = justGrokItConfig.options.style.values.male;
  const femaleStyles = justGrokItConfig.options.style.values.female;
  
  return {
    totalStyles: maleStyles.length + femaleStyles.length,
    maleStyles: maleStyles.length,
    femaleStyles: femaleStyles.length,
    totalVariants: getTotalVariants(),
    accessories: justGrokItConfig.accessories.length,
    uniqueColors: [...new Set([
      ...maleStyles.flatMap(s => s.colors),
      ...femaleStyles.flatMap(s => s.colors)
    ])].length
  };
};

export default justGrokItConfig;