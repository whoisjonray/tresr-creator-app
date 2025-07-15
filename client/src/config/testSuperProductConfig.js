// Test SuperProduct Configuration - Complete Collection
// Male/Female garments + accessories with real Cloudinary URLs

export const testSuperProductConfig = {
  id: 'test-design-complete-collection',
  title: 'Test Design - Complete Collection',
  description: 'Full SuperProduct test with male/female garments and accessories',
  designImage: 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752270680/designs/test-design-placeholder.png',
  
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
            id: 'boxy',
            name: 'Oversized Drop Shoulder',
            price: '28.00',
            colors: ['black', 'cardinal-red', 'heather-grey', 'natural', 'navy', 'white'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Relaxed fit oversized t-shirt with drop shoulders',
            cloudinaryBase: 'tresr-garments/boxy'
          },
          {
            id: 'polo',
            name: 'Standard Polo',
            price: '32.00',
            colors: ['black', 'white', 'navy', 'red', 'graphite'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Classic polo shirt with collar and three-button placket',
            cloudinaryBase: 'tresr-garments/polo'
          },
          {
            id: 'mediu',
            name: 'Sweatshirt',
            price: '38.00',
            colors: ['black', 'white', 'navy', 'red', 'grey-heather'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Medium weight crew neck sweatshirt',
            cloudinaryBase: 'tresr-garments/mediu'
          },
          {
            id: 'tee',
            name: 'Classic T-Shirt',
            price: '22.00',
            colors: ['black', 'cardinal-red', 'dark-heather-grey'],
            sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
            description: 'Medium weight cotton t-shirt',
            cloudinaryBase: 'tresr-garments/tee'
          },
          {
            id: 'med-hood',
            name: 'Hoodie',
            price: '45.00',
            colors: ['black', 'white', 'gold', 'red', 'navy'],
            sizes: ['S', 'M', 'L', 'XL', '2XL'],
            description: 'Medium weight pullover hoodie with front pocket',
            cloudinaryBase: 'tresr-garments/med-hood'
          }
        ],
        female: [
          {
            id: 'next-crop',
            name: 'Crop Top',
            price: '24.00',
            colors: ['black', 'white', 'grey-heather', 'midnight-navy', 'red'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Next Level women\'s ideal crop top',
            cloudinaryBase: 'tresr-garments/next-crop'
          },
          {
            id: 'wmn-hoodie',
            name: 'Crop Hoodie',
            price: '42.00',
            colors: ['black', 'black-camo', 'pink', 'bone', 'cotton-candy', 'gray-heather', 'sage', 'white'],
            sizes: ['S', 'M', 'L', 'XL'],
            description: 'Women\'s lightweight crop hoodie',
            cloudinaryBase: 'tresr-garments/wmn-hoodie'
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
      colors: ['black', 'grey'],
      description: 'Flexfit curved visor snapback with custom patch',
      cloudinaryBase: 'tresr-garments/patch-c',
      productType: 'accessory'
    },
    {
      id: 'patch-flat',
      name: 'Flat Brim Hat',
      price: '25.00',
      colors: ['black', 'navy'],
      description: 'Premium flat bill snapback cap with custom patch',
      cloudinaryBase: 'tresr-garments/patch-flat',
      productType: 'accessory'
    }
  ]
};

// Helper functions for the configuration
export const getStylesForFit = (fit) => {
  if (!fit) return [];
  return testSuperProductConfig.options.style.values[fit.toLowerCase()] || [];
};

export const getStyleById = (styleId) => {
  const allStyles = [
    ...testSuperProductConfig.options.style.values.male,
    ...testSuperProductConfig.options.style.values.female
  ];
  return allStyles.find(style => style.id === styleId);
};

export const getGarmentImageUrl = (garmentId, color, side = 'front') => {
  const style = getStyleById(garmentId);
  if (!style) return null;
  
  // Use actual Cloudinary URLs from the upload report
  const cloudinaryMapping = {
    'boxy': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444370/tresr-garments/boxy_black_front.jpg',
      'cardinal-red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444373/tresr-garments/boxy_cardinal-red_front.jpg',
      'heather-grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444376/tresr-garments/boxy_heather-grey_front.jpg',
      'natural': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444378/tresr-garments/boxy_natural_front.jpg',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444380/tresr-garments/boxy_navy_front.jpg',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444382/tresr-garments/boxy_white_front.jpg'
    },
    'next-crop': {
      'black': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444384/tresr-garments/next-crop_black_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444386/tresr-garments/next-crop_black_back.jpg',
      'white': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444388/tresr-garments/next-crop_white_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444391/tresr-garments/next-crop_white_back.jpg',
      'grey-heather': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444393/tresr-garments/next-crop_grey-heather_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444396/tresr-garments/next-crop_grey-heather_back.jpg',
      'midnight-navy': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444398/tresr-garments/next-crop_midnight-navy_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444400/tresr-garments/next-crop_midnight-navy_back.jpg',
      'red': side === 'front' ? 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444403/tresr-garments/next-crop_red_front.jpg' : 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444405/tresr-garments/next-crop_red_back.jpg'
    },
    'polo': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444408/tresr-garments/polo_black_front.jpg',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444410/tresr-garments/polo_white_front.jpg',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444413/tresr-garments/polo_navy_front.jpg',
      'red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444415/tresr-garments/polo_red_front.jpg',
      'graphite': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444418/tresr-garments/polo_graphite_front.jpg'
    },
    'mediu': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444420/tresr-garments/mediu_black_front.png',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444423/tresr-garments/mediu_white_front.png',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444425/tresr-garments/mediu_navy_front.png',
      'red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444428/tresr-garments/mediu_red_front.png',
      'grey-heather': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444431/tresr-garments/mediu_grey-heather_front.png'
    },
    'tee': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444434/tresr-garments/tee_black_back.png',
      'cardinal-red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444437/tresr-garments/tee_cardinal-red_back.png',
      'dark-heather-grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444439/tresr-garments/tee_dark-heather-grey_back.png'
    },
    'med-hood': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444442/tresr-garments/med-hood_black_front.png',
      'white': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444444/tresr-garments/med-hood_white_front.png',
      'gold': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444447/tresr-garments/med-hood_gold_front.png',
      'red': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444450/tresr-garments/med-hood_red_front.png',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444453/tresr-garments/med-hood_navy_front.png'
    },
    'patch-c': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444455/tresr-garments/patch-c_black_front.png',
      'grey': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444463/tresr-garments/patch-c_grey_front.png'
    },
    'patch-flat': {
      'black': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444473/tresr-garments/patch-flat_black_front.png',
      'navy': 'https://res.cloudinary.com/dqslerzk9/image/upload/v1752444480/tresr-garments/patch-flat_navy_front.png'
    }
  };

  return cloudinaryMapping[garmentId]?.[color] || null;
};

export const getSummaryStats = () => {
  const maleStyles = testSuperProductConfig.options.style.values.male;
  const femaleStyles = testSuperProductConfig.options.style.values.female;
  
  const maleColors = maleStyles.reduce((total, style) => total + style.colors.length, 0);
  const femaleColors = femaleStyles.reduce((total, style) => total + style.colors.length, 0);
  
  return {
    totalStyles: maleStyles.length + femaleStyles.length,
    maleStyles: maleStyles.length,
    femaleStyles: femaleStyles.length,
    totalColors: maleColors + femaleColors,
    maleColors,
    femaleColors,
    accessories: testSuperProductConfig.accessories.length
  };
};

export default testSuperProductConfig;