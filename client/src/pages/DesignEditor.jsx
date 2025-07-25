import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import mockupService from '../services/mockupService';
import canvasImageGenerator from '../services/canvasImageGenerator';
import { getGarmentImage as getCloudinaryImage } from '../config/garmentImagesCloudinary';
import './DesignEditor.css'; // v2 - square swatches with 14 colors
import { userStorage } from '../utils/userStorage';

// Get API base URL from environment
const getApiBaseURL = () => {
  const currentHost = window.location.hostname;
  
  if (currentHost.includes('ngrok') || currentHost === 'localhost') {
    return window.location.origin + '/api';
  }
  
  if (currentHost === 'creators.tresr.com') {
    return 'https://creators.tresr.com/api';
  }
  
  return 'http://localhost:3002/api';
};

// Map product IDs to actual Sanity SKUs we migrated
// Color mapping strategy:
// - Each product uses color categories rather than specific color names
// - Actual garment colors are shown in product images
// - Mappings: Charcoal/Black Camo → Dark Grey, Gray/Heather variations → Light Grey,
//   Bone/Beige → Natural, Red variations → Cardinal Red, Blue → Royal Heather,
//   Sage → Mint, Classic Navy → Navy
const PRODUCT_TEMPLATES = [
  // Core Apparel - Updated to match TRESR.com exactly
  { id: 'tee', name: 'Medium Weight T-Shirt', templateId: 'tshirt_front', price: 22, colors: ['Black', 'Navy', 'Natural', 'White', 'Dark Grey', 'Cardinal Red'] },
  { id: 'boxy', name: 'Oversized Drop Shoulder', templateId: 'tshirt_boxy_front', price: 26, colors: ['Black', 'Natural'] }, // Restored to TRESR.com colors
  { id: 'next-crop', name: 'Next Level Crop Top', templateId: 'croptop_front', price: 24, colors: ['Black', 'Gold', 'Royal Heather', 'Dark Grey', 'Pink', 'Light Grey', 'Navy', 'Cardinal Red', 'White'] },
  
  // Hoodies & Sweatshirts - Updated to match TRESR.com exactly
  { id: 'wmn-hoodie', name: "Women's Independent Hoodie", templateId: 'hoodie_front', price: 42, colors: ['Black', 'Black Camo', 'Pink', 'Natural', 'Cotton Candy', 'Light Grey', 'Mint', 'White'] },
  { id: 'med-hood', name: 'Medium Weight Hoodie', templateId: 'hoodie_front', price: 42, colors: ['Black', 'White', 'Gold', 'Light Grey', 'Cardinal Red', 'Alpine Green', 'Navy', 'Mint'] },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', templateId: 'crewneck_front', price: 36, colors: ['Black', 'White', 'Navy', 'Light Grey', 'Army Heather', 'Cardinal Red', 'Royal Heather', 'Dark Grey'] },
  { id: 'sweat', name: 'Standard Sweatshirt', templateId: 'crewneck_front', price: 34, colors: ['Black'] },
  
  // Hats
  { id: 'patch-c', name: 'Patch Hat - Curved', templateId: 'hat_front', price: 22, colors: ['Black', 'Navy'] },
  { id: 'patch-flat', name: 'Patch Hat - Flat', templateId: 'hat_flat', price: 24, colors: ['Black', 'Navy'] },
  
  // Polos
  { id: 'polo', name: 'Standard Polo', templateId: 'polo_front', price: 28, colors: ['Black', 'White', 'Navy', 'Light Grey'] },
  { id: 'long-polo', name: 'Long Sleeve Polo', templateId: 'polo_long_front', price: 32, colors: ['Black', 'White', 'Navy', 'Light Grey'] },
  
  // Other Products
  { id: 'mug', name: 'Coffee Mug', templateId: 'mug_front', price: 15, colors: ['White'] },
  
  // Art Canvas
  { id: 'art-sqsm', name: 'Art Canvas - 12x12', templateId: 'canvas_square', price: 35, colors: ['White'] },
  { id: 'art-sqm', name: 'Art Canvas - 16x16', templateId: 'canvas_square', price: 45, colors: ['White'] },
  { id: 'art-lg', name: 'Art Canvas - 24x24', templateId: 'canvas_square', price: 65, colors: ['White'] },
  
  // Trading Cards
  { id: 'nft', name: 'NFTREASURE NFT Cards', templateId: 'trading_card', price: 5, colors: ['Default'] }
];

// Consolidated color categories for all products
const COLOR_PALETTE = [
  // Core neutrals
  { name: 'Black', hex: '#000000' },
  { name: 'Black Camo', hex: '#1a1a1a' }, // Women's hoodie specific
  { name: 'Dark Grey', hex: '#4A4A4A' },  // Covers: Charcoal, Dark Heather Gray, Heather-Grey
  { name: 'Light Grey', hex: '#9CA3AF' }, // Covers: Gray, Gray Heather, Heather Grey
  { name: 'Natural', hex: '#FEF3C7' },    // Covers: Natural, Bone, Beige tones
  { name: 'White', hex: '#FAFAFA' },
  
  // Colors
  { name: 'Mint', hex: '#98FF98' },       // Covers: Mint, Sage
  { name: 'Navy', hex: '#080F20' },       // Covers: Navy, Classic Navy, Midnight-Navy
  { name: 'Cardinal Red', hex: '#EC5039' },// Covers: Red, Burgundy, Maroon, Cardinal-Red
  { name: 'Gold', hex: '#F6CB46' },       // Covers: Gold, Antique-Gold
  { name: 'Alpine Green', hex: '#165B33' },
  { name: 'Army Heather', hex: '#6B7043' },// Military green heather
  { name: 'Royal Heather', hex: '#4169E1' },// Royal blue heather, covers: Blue, Royal-Blue, True Royal
  { name: 'Pink', hex: '#F82F57' },       // Covers: Pink, Desert-Pink
  { name: 'Cotton Candy', hex: '#FFB6C1' }
];

const PRODUCT_ICONS = {
  'tee': '👕',
  'boxy': '👕',
  'next-crop': '👚',
  'wmn-hoodie': '🧥',
  'med-hood': '🧥',
  'mediu': '👔',
  'sweat': '👔',
  'patch-c': '🧢',
  'patch-flat': '🧢',
  'art-sqsm': '🖼️',
  'art-sqm': '🖼️',
  'art-lg': '🖼️',
  'polo': '👔',
  'nft': '🎴'
};

// Print area configurations for each product type
// Dimensions are relative to a 400x400 canvas
const PRINT_AREAS = {
  // T-shirts - standard chest print area
  'tee': { width: 200, height: 286, x: 200, y: 80 },
  'boxy': { width: 220, height: 286, x: 200, y: 90 },
  'next-crop': { width: 180, height: 200, x: 200, y: 100 },
  
  // Hoodies - slightly lower and wider
  'wmn-hoodie': { width: 200, height: 260, x: 200, y: 120 },
  'med-hood': { width: 200, height: 260, x: 200, y: 120 },
  'mediu': { width: 200, height: 280, x: 200, y: 100 },
  'sweat': { width: 200, height: 280, x: 200, y: 100 },
  
  // Hats - smaller centered area
  'patch-c': { width: 120, height: 80, x: 200, y: 160 },
  'patch-flat': { width: 140, height: 80, x: 200, y: 160 },
  
  // Canvas - full area with small margin
  'art-sqsm': { width: 360, height: 360, x: 200, y: 200 },
  'art-sqm': { width: 360, height: 360, x: 200, y: 200 },
  'art-lg': { width: 360, height: 360, x: 200, y: 200 },
  
  // Polo - smaller chest area
  'polo': { width: 160, height: 200, x: 200, y: 100 },
  
  // Trading card - full area
  'nft': { width: 300, height: 400, x: 200, y: 200 }
};

function DesignEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const canvasRef = useRef(null);
  const garmentImage = useRef(new Image());
  
  // Track which side we're viewing - MUST be defined before useMemo hooks
  const [viewSide, setViewSide] = useState('front');
  
  // Separate design images for front and back
  const [frontDesignImage, setFrontDesignImage] = useState(null);
  const [backDesignImage, setBackDesignImage] = useState(null);
  const [frontDesignImageSrc, setFrontDesignImageSrc] = useState(null);
  const [backDesignImageSrc, setBackDesignImageSrc] = useState(null);
  const [frontDesignFile, setFrontDesignFile] = useState(null);
  const [backDesignFile, setBackDesignFile] = useState(null);
  const [frontDesignUrl, setFrontDesignUrl] = useState(null);
  const [backDesignUrl, setBackDesignUrl] = useState(null);
  
  // Legacy support - current design based on active side (using useMemo to prevent initialization issues)
  const designImage = useMemo(() => 
    viewSide === 'front' ? frontDesignImage : backDesignImage, 
    [viewSide, frontDesignImage, backDesignImage]
  );
  const designImageSrc = useMemo(() => 
    viewSide === 'front' ? frontDesignImageSrc : backDesignImageSrc, 
    [viewSide, frontDesignImageSrc, backDesignImageSrc]
  );
  const setDesignImage = useMemo(() => 
    viewSide === 'front' ? setFrontDesignImage : setBackDesignImage, 
    [viewSide]
  );
  const setDesignImageSrc = useMemo(() => 
    viewSide === 'front' ? setFrontDesignImageSrc : setBackDesignImageSrc, 
    [viewSide]
  );
  const [designFile, setDesignFile] = useState(null);
  const [designUrl, setDesignUrl] = useState(null);
  const [designTitle, setDesignTitle] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [tags, setTags] = useState('');
  const [matureContent, setMatureContent] = useState(false);
  const [currentMockup, setCurrentMockup] = useState(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [printMethod, setPrintMethod] = useState('auto'); // auto = Use What's Best, dtg, dtf
  const [imageQualityWarning, setImageQualityWarning] = useState(null);
  const [colorFilter, setColorFilter] = useState('All'); // All, Light, Dark, None
  
  const [activeProduct, setActiveProduct] = useState(PRODUCT_TEMPLATES[0].id);
  const [productConfigs, setProductConfigs] = useState(() => {
    const configs = {};
    PRODUCT_TEMPLATES.forEach(product => {
      const printArea = PRINT_AREAS[product.id] || { x: 200, y: 80 };
      configs[product.id] = {
        enabled: product.id === 'tee' || product.id === 'wmn-hoodie',
        // Separate positions for front and back
        frontPosition: { x: printArea.x, y: printArea.y, width: 150, height: 150 },
        backPosition: { x: printArea.x, y: printArea.y, width: 150, height: 150 },
        defaultColor: '', // Start with no default color selected
        selectedColor: '',
        selectedColors: [], // Array of selected colors for variants
        printLocation: 'front' // New: track front/back/both
      };
    });
    return configs;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(100);
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });
  const [nfcExperienceType, setNfcExperienceType] = useState('default');
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [isProductPublished, setIsProductPublished] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setDesignFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Check image dimensions
        if (img.width < 1500) {
          setImageQualityWarning({
            type: 'warning',
            message: `Your image is ${img.width}px wide. We recommend at least 1500px for best print quality.`,
            currentWidth: img.width,
            recommendedWidth: 1500
          });
        } else {
          setImageQualityWarning(null);
        }
        
        // Always set front image when using the main drop zone
        setFrontDesignImage(img);
        setFrontDesignImageSrc(e.target.result);
        setFrontDesignFile(file);
        
        // Update all product configs with correct aspect ratio
        const aspectRatio = img.width / img.height;
        
        setProductConfigs(prev => {
          const newConfigs = {};
          Object.keys(prev).forEach(productId => {
            const printArea = PRINT_AREAS[productId] || { width: 200, height: 286, x: 200, y: 80 };
            
            // Calculate size to fit within print area while maintaining aspect ratio
            let designWidth, designHeight;
            const maxWidth = printArea.width * 0.8; // 80% of print area
            const maxHeight = printArea.height * 0.8;
            
            if (aspectRatio > maxWidth / maxHeight) {
              // Design is wider than print area ratio
              designWidth = maxWidth;
              designHeight = maxWidth / aspectRatio;
            } else {
              // Design is taller than print area ratio
              designHeight = maxHeight;
              designWidth = maxHeight * aspectRatio;
            }
            
            // Update both front and back positions with the new dimensions
            newConfigs[productId] = {
              ...prev[productId],
              frontPosition: {
                x: printArea.x, // Center in print area
                y: printArea.y,
                width: designWidth,
                height: designHeight
              },
              backPosition: {
                x: printArea.x, // Center in print area
                y: printArea.y,
                width: designWidth,
                height: designHeight
              }
            };
          });
          return newConfigs;
        });
        
        // Force a redraw after image loads
        // drawCanvas will be called by the useEffect hook
      };
      img.src = e.target.result;
      
      // Upload design to get URL for mockup generation
      mockupService.uploadDesign(e.target.result)
        .then(url => {
          setFrontDesignUrl(url);
          console.log('Front design uploaded:', url);
        })
        .catch(err => {
          console.error('Failed to upload front design:', err);
          // Continue without URL for now
          setFrontDesignUrl(e.target.result);
        });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  // Generate mockup when product changes or design position updates
  const generateMockupPreview = useCallback(async () => {
    if (!designUrl || !activeProduct || isGeneratingMockup) return;
    
    const product = PRODUCT_TEMPLATES.find(p => p.id === activeProduct);
    const config = productConfigs[activeProduct];
    
    if (!product || !config || !config.enabled) return;
    
    setIsGeneratingMockup(true);
    
    try {
      // Get the current position based on view side
      const currentPos = getCurrentPosition(productId);
      
      // Convert canvas position to API format
      const apiPosition = mockupService.convertToApiPosition(
        { x: currentPos.x, y: currentPos.y },
        { width: 400, height: 400 }
      );
      
      const apiScale = mockupService.calculateApiScale(
        { width: currentPos.width, height: currentPos.height },
        { width: 400, height: 400 },
        designScale / 100
      );
      
      const mockup = await mockupService.generatePreview(
        designUrl,
        product.templateId,
        config.hoverColor || config.selectedColor || config.defaultColor,
        {
          position: apiPosition,
          scale: apiScale,
          rotation: 0
        }
      );
      
      setCurrentMockup(mockup);
    } catch (error) {
      console.error('Failed to generate mockup:', error);
    } finally {
      setIsGeneratingMockup(false);
    }
  }, [designUrl, activeProduct, productConfigs, designScale, isGeneratingMockup]);

  // Debounce mockup generation
  useEffect(() => {
    const timer = setTimeout(() => {
      generateMockupPreview();
    }, 500); // Wait 500ms after changes stop
    
    return () => clearTimeout(timer);
  }, [productConfigs, activeProduct, designScale]);

  // Helper function to get current position based on view side
  const getCurrentPosition = (productId = activeProduct) => {
    const config = productConfigs[productId];
    if (!config) return { x: 200, y: 80, width: 150, height: 150 };
    
    return viewSide === 'front' ? config.frontPosition : config.backPosition;
  };

  // Helper function to update current position based on view side
  const updateCurrentPosition = (productId, newPosition) => {
    const positionKey = viewSide === 'front' ? 'frontPosition' : 'backPosition';
    setProductConfigs(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [positionKey]: newPosition
      }
    }));
  };

  const drawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = productConfigs[activeProduct];
    const currentPosition = getCurrentPosition();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill background with light gray
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get print area dimensions for current product
    const printArea = PRINT_AREAS[activeProduct] || { width: 200, height: 286, x: 200, y: 80 };
    const printAreaWidth = printArea.width;
    const printAreaHeight = printArea.height;
    const printAreaX = printArea.x - (printAreaWidth / 2);
    const printAreaY = printArea.y - (printAreaHeight / 2);
    
    // Try to get and draw the garment image
    const selectedColor = config?.hoverColor || config?.selectedColor || config?.defaultColor || 'Black';
    // Determine which side to show based on print location
    let displaySide = 'front';
    if (config?.printLocation === 'back') {
      displaySide = 'back';
    } else if (config?.printLocation === 'both') {
      displaySide = viewSide; // Use the toggle selection
    }
    const garmentImageUrl = getCloudinaryImage(activeProduct, selectedColor, displaySide);
    
    if (garmentImageUrl && garmentImage.current) {
      // If garment image is loaded, draw it centered on canvas
      const imgWidth = garmentImage.current.width;
      const imgHeight = garmentImage.current.height;
      const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight) * 0.9;
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      
      ctx.drawImage(garmentImage.current, x, y, scaledWidth, scaledHeight);
    }
    
    // Draw design if available (AFTER garment image)
    if (designImage && config) {
      ctx.save();
      
      // Clip to print area
      ctx.beginPath();
      ctx.rect(printAreaX, printAreaY, printAreaWidth, printAreaHeight);
      ctx.clip();
      
      const { x, y, width, height } = currentPosition;
      
      try {
        ctx.drawImage(designImage, x - width/2, y - height/2, width, height);
      } catch (e) {
        console.error('Error drawing design:', e);
      }
      
      ctx.restore();
    }
    
    // Only show print area guides if there's a design
    if (designImage) {
      // Draw subtle print area outline
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(printAreaX, printAreaY, printAreaWidth, printAreaHeight);
      ctx.setLineDash([]);
    }
    
    // Draw center guides when dragging
    if (isDragging) {
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([2, 4]);
      ctx.lineWidth = 1;
      // Vertical center line
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw selection border only when hovering over canvas
    if (designImage && config && showBoundingBox) {
      const { x, y, width, height } = currentPosition;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - width/2, y - height/2, width, height);
    }
  };

  React.useEffect(() => {
    drawCanvas();
  }, [activeProduct, productConfigs, designImage, showBoundingBox, isDragging, viewSide, frontDesignImage, backDesignImage]);
  
  // Update viewSide when switching products based on their print location
  React.useEffect(() => {
    const config = productConfigs[activeProduct];
    if (config?.printLocation === 'front') {
      setViewSide('front');
    } else if (config?.printLocation === 'back') {
      setViewSide('back');
    }
    // For 'both', keep the current viewSide
  }, [activeProduct, productConfigs[activeProduct]?.printLocation]);

  // Load garment image when product or color changes
  React.useEffect(() => {
    const config = productConfigs[activeProduct];
    const selectedColor = config?.hoverColor || config?.selectedColor || config?.defaultColor || 'Black';
    // Determine which side to show based on print location
    let displaySide = 'front';
    if (config?.printLocation === 'back') {
      displaySide = 'back';
    } else if (config?.printLocation === 'both') {
      displaySide = viewSide; // Use the toggle selection
    }
    const garmentImageUrl = getCloudinaryImage(activeProduct, selectedColor, displaySide);
    
    if (garmentImageUrl) {
      const img = new Image();
      img.onload = () => {
        garmentImage.current = img;
        drawCanvas(); // Redraw canvas with new garment image
      };
      img.onerror = () => {
        console.error('Failed to load garment image:', garmentImageUrl);
        garmentImage.current = null;
        drawCanvas(); // Still redraw even if image fails
      };
      img.src = garmentImageUrl;
    } else {
      garmentImage.current = null;
      drawCanvas();
    }
  }, [activeProduct, productConfigs[activeProduct]?.selectedColor, productConfigs[activeProduct]?.printLocation, viewSide]);

  // Load existing product data when editing
  useEffect(() => {
    if (params.id && location.state?.productData) {
      const productData = location.state.productData;
      console.log('Loading existing product for edit:', productData);
      
      // Load product details
      setDesignTitle(productData.name || '');
      setDesignDescription(productData.description || '');
      
      // Handle tags - could be array or string
      if (Array.isArray(productData.tags)) {
        setTags(productData.tags.join(', '));
      } else if (typeof productData.tags === 'string') {
        setTags(productData.tags);
      } else {
        setTags('');
      }
      
      // Load supporting text if available
      if (productData.supportingText) {
        setSupportingText(productData.supportingText);
      }
      
      // Load print method if available
      if (productData.printMethod) {
        setPrintMethod(productData.printMethod);
      }
      
      
      // Load product configurations with positions (do this after image loads)
      if (productData.productConfigs) {
        console.log('Loading product configs:', productData.productConfigs);
        
        // Migrate old position format to new front/back format
        const migratedConfigs = {};
        Object.entries(productData.productConfigs).forEach(([productId, config]) => {
          if (config.position && (!config.frontPosition || !config.backPosition)) {
            // Old format with single position - migrate to new format
            migratedConfigs[productId] = {
              ...config,
              frontPosition: config.position,
              backPosition: config.position,
              position: undefined // Remove old position property
            };
          } else {
            // Already in new format or has no position
            migratedConfigs[productId] = config;
          }
        });
        
        setProductConfigs(migratedConfigs);
      }
      
      // Load NFC settings
      if (productData.nfcEnabled !== undefined) {
        setNfcExperienceType(productData.nfcEnabled ? 'default' : 'none');
      }
      
      // Set product publish status
      setIsProductPublished(!productData.isDraft);
      
      // Try to load front and back images
      const frontImageToLoad = productData.frontDesignImageSrc || 
                               productData.originalDesignImage || 
                               productData.previewImage || 
                               (productData.mockups && productData.mockups.length > 0 && 
                                productData.mockups.find(m => m.designPreview)?.designPreview);
      
      if (frontImageToLoad) {
        const img = new Image();
        img.onload = () => {
          setFrontDesignImage(img);
          setFrontDesignImageSrc(frontImageToLoad);
          if (productData.frontDesignUrl) {
            setFrontDesignUrl(productData.frontDesignUrl);
          }
          
          // If we already have saved product configs with positions, don't modify them
          // Only update configs if this is a new design without saved positions
          if (!productData.productConfigs) {
            const aspectRatio = img.width / img.height;
            const baseWidth = 150;
            const baseHeight = baseWidth / aspectRatio;
            
            setProductConfigs(prev => {
              const newConfigs = {};
              Object.keys(prev).forEach(productId => {
                newConfigs[productId] = {
                  ...prev[productId],
                  frontPosition: {
                    ...prev[productId].frontPosition,
                    width: baseWidth,
                    height: baseHeight
                  },
                  backPosition: {
                    ...prev[productId].backPosition,
                    width: baseWidth,
                    height: baseHeight
                  }
                };
              });
              return newConfigs;
            });
          }
        };
        img.src = frontImageToLoad;
      }
      
      // Load back image if available
      console.log('🔥 BACK IMAGE DEBUG:', {
        hasBackDesignImageSrc: !!productData.backDesignImageSrc,
        backDesignImageSrc: productData.backDesignImageSrc?.substring(0, 50) + '...',
        hasBackDesignUrl: !!productData.backDesignUrl,
        allKeys: Object.keys(productData),
        fullProductData: productData
      });
      
      if (productData.backDesignImageSrc) {
        const backImg = new Image();
        backImg.onload = () => {
          console.log('✅ Back image loaded successfully');
          setBackDesignImage(backImg);
          setBackDesignImageSrc(productData.backDesignImageSrc);
          if (productData.backDesignUrl) {
            setBackDesignUrl(productData.backDesignUrl);
          }
          // Force canvas redraw after a small delay
          setTimeout(() => {
            drawCanvas();
          }, 100);
        };
        backImg.onerror = () => {
          console.error('❌ Failed to load back image:', productData.backDesignImageSrc?.substring(0, 100));
        };
        backImg.src = productData.backDesignImageSrc;
      } else {
        console.log('❌ No back design image found in productData');
      }
      
      // Only set enabled products from mockups if we don't have saved productConfigs
      if (productData.mockups && !productData.productConfigs) {
        setProductConfigs(prev => {
          const newConfigs = { ...prev };
          // Reset all to disabled first
          Object.keys(newConfigs).forEach(productId => {
            newConfigs[productId].enabled = false;
          });
          
          // Enable products that have mockups
          productData.mockups.forEach(mockup => {
            const productId = PRODUCT_TEMPLATES.find(t => 
              t.templateId === mockup.type || t.name === mockup.type
            )?.id;
            if (productId && newConfigs[productId]) {
              newConfigs[productId].enabled = true;
            }
          });
          
          return newConfigs;
        });
      }
      
      // Always start with front view when editing, even if there's a back image
      // Users can manually switch to back view if needed
      setViewSide('front');
    }
  }, [params.id, location.state]);

  const handleCanvasMouseDown = (e) => {
    if (!designImage) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const config = productConfigs[activeProduct];
    
    // Check if click is on the design
    const { x: cx, y: cy, width, height } = getCurrentPosition();
    if (x >= cx - width/2 && x <= cx + width/2 && y >= cy - height/2 && y <= cy + height/2) {
      setIsDragging(true);
      setDragStart({ 
        x: x - cx, 
        y: y - cy 
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!designImage) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cursor on hover
    if (!isDragging) {
      const { x: cx, y: cy, width, height } = getCurrentPosition();
      
      if (x >= cx - width/2 && x <= cx + width/2 && y >= cy - height/2 && y <= cy + height/2) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
    
    // Handle dragging
    if (isDragging) {
      const printArea = PRINT_AREAS[activeProduct] || { width: 200, height: 286, x: 200, y: 80 };
      const currentPosition = getCurrentPosition();
      const halfWidth = currentPosition.width / 2;
      const halfHeight = currentPosition.height / 2;
      
      // Calculate boundaries based on print area
      const minX = (printArea.x - printArea.width/2) + halfWidth;
      const maxX = (printArea.x + printArea.width/2) - halfWidth;
      const minY = (printArea.y - printArea.height/2) + halfHeight;
      const maxY = (printArea.y + printArea.height/2) - halfHeight;
      
      const newPosition = {
        ...currentPosition,
        x: Math.max(minX, Math.min(maxX, x - dragStart.x)),
        y: Math.max(minY, Math.min(maxY, y - dragStart.y))
      };
      
      updateCurrentPosition(activeProduct, newPosition);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (e) => {
    const scale = parseInt(e.target.value);
    setDesignScale(scale);
    
    if (!designImage) return;
    
    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = designImage.width / designImage.height;
    const printArea = PRINT_AREAS[activeProduct] || { width: 200, height: 286 };
    const baseSize = Math.min(printArea.width, printArea.height) * 0.5;
    const newWidth = baseSize * (scale / 100);
    const newHeight = newWidth / aspectRatio;
    
    // Ensure the scaled design fits within print area
    const maxWidth = printArea.width * 0.95;
    const maxHeight = printArea.height * 0.95;
    let finalWidth = newWidth;
    let finalHeight = newHeight;
    
    if (finalWidth > maxWidth) {
      finalWidth = maxWidth;
      finalHeight = finalWidth / aspectRatio;
    }
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = finalHeight * aspectRatio;
    }
    
    // Update the position for the current view side
    const positionKey = viewSide === 'front' ? 'frontPosition' : 'backPosition';
    setProductConfigs(prev => ({
      ...prev,
      [activeProduct]: {
        ...prev[activeProduct],
        [positionKey]: {
          ...prev[activeProduct][positionKey],
          width: finalWidth,
          height: finalHeight
        }
      }
    }));
  };

  const handleProductToggle = (productId) => {
    setProductConfigs(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        enabled: !prev[productId].enabled
      }
    }));
  };


  const calculateTotalVariants = () => {
    const enabledProducts = Object.entries(productConfigs)
      .filter(([_, config]) => config.enabled);
    
    // Calculate variants based on each product's available colors
    const totalVariants = enabledProducts.reduce((total, [productId, config]) => {
      const product = PRODUCT_TEMPLATES.find(p => p.id === productId);
      const availableColors = product?.colors?.length || 1; // Use product's available colors
      const sizes = 8; // Standard sizes S-5XL
      return total + (availableColors * sizes);
    }, 0);
    
    return totalVariants;
  };

  const handleUnpublishToDraft = async () => {
    if (!window.confirm('Unpublish this design to draft? It will no longer be live.')) {
      return;
    }
    
    try {
      const isEditMode = params.id && location.state?.productData;
      if (!isEditMode) return;
      
      // Update the product to draft status
      const savedProducts = userStorage.getProducts();
      const index = savedProducts.findIndex(p => p.id === params.id);
      
      if (index !== -1) {
        savedProducts[index].isDraft = true;
        userStorage.setProducts(savedProducts);
        setIsProductPublished(false);
        alert('Design unpublished to draft! Redirecting to products page...');
        navigate('/products');
      }
    } catch (error) {
      console.error('Error unpublishing:', error);
      alert('Failed to unpublish design');
    }
  };

  const handleUpdateDesign = async () => {
    // Use the same logic as publish but for updating
    await handleGenerateProducts();
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('Delete this design permanently? This cannot be undone.')) {
      return;
    }
    
    try {
      const isEditMode = params.id && location.state?.productData;
      if (!isEditMode) return;
      
      // Remove the product from localStorage
      const savedProducts = userStorage.getProducts();
      const updatedProducts = savedProducts.filter(p => p.id !== params.id);
      userStorage.setProducts(updatedProducts);
      
      alert('Design deleted successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete design');
    }
  };

  const handleSaveForLater = async () => {
    // In edit mode, we don't need a new file upload
    const isEditMode = params.id && location.state?.productData;
    if ((!designFile && !isEditMode) || !designTitle) {
      alert('Please upload a design and add a title');
      return;
    }
    
    try {
      // In edit mode, update existing product; otherwise create new
      const isEditMode = params.id && location.state?.productData;
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      console.log('🔥 SAVE DEBUG:', {
        hasFrontDesignImageSrc: !!frontDesignImageSrc,
        hasBackDesignImageSrc: !!backDesignImageSrc,
        hasFrontDesignUrl: !!frontDesignUrl,
        hasBackDesignUrl: !!backDesignUrl,
        frontDesignImageSrcLength: frontDesignImageSrc?.length,
        backDesignImageSrcLength: backDesignImageSrc?.length,
        backDesignImageSrcPreview: backDesignImageSrc?.substring(0, 50)
      });
      
      const savedProduct = {
        id: isEditMode ? params.id : `draft_${timestamp}_${randomSuffix}`,
        name: designTitle,
        description: designDescription,
        supportingText: supportingText, // Save supporting text
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        nfcEnabled: nfcExperienceType !== 'none',
        originalDesignImage: frontDesignImageSrc, // Store original front for editing
        previewImage: frontDesignImageSrc, // Store for product card display
        designUrl: frontDesignUrl,
        frontDesignImageSrc: frontDesignImageSrc,
        backDesignImageSrc: backDesignImageSrc,
        frontDesignUrl: frontDesignUrl,
        backDesignUrl: backDesignUrl,
        printMethod: printMethod, // Save the selected print method
        productConfigs: productConfigs, // Save product positions and configurations
        // No longer saving global selected colors - each product has its own default color
        mockups: [
          {
            id: `draft_mockup_${timestamp}_${randomSuffix}`,
            type: 'Draft Design',
            color: 'Preview',
            price: 0,
            image: designImageSrc || generateDraftPlaceholder(designTitle)
          }
        ],
        variants: 0,
        isDraft: true,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const savedProducts = userStorage.getProducts();
      
      if (isEditMode) {
        // Update existing product
        const index = savedProducts.findIndex(p => p.id === params.id);
        if (index !== -1) {
          savedProducts[index] = savedProduct;
        } else {
          savedProducts.unshift(savedProduct);
        }
      } else {
        // Add new product
        savedProducts.unshift(savedProduct);
      }
      
      userStorage.setProducts(savedProducts);
      
      console.log('🔥 SAVED PRODUCT DEBUG:', {
        savedProductId: savedProduct.id,
        hasFrontDesignImageSrc: !!savedProduct.frontDesignImageSrc,
        hasBackDesignImageSrc: !!savedProduct.backDesignImageSrc,
        frontImageLength: savedProduct.frontDesignImageSrc?.length,
        backImageLength: savedProduct.backDesignImageSrc?.length,
        allKeys: Object.keys(savedProduct)
      });
      
      alert('Design saved! Redirecting to products page...');
      
      // Navigate to products page
      navigate('/products');
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    }
  };

  // Helper function to generate draft placeholder
  const generateDraftPlaceholder = (title) => {
    const svg = `
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="400" fill="#e0e0e0"/>
        <text x="50%" y="45%" text-anchor="middle" fill="#666" 
              font-family="Arial" font-size="16" dy=".3em">
          DRAFT
        </text>
        <text x="50%" y="55%" text-anchor="middle" fill="#333" 
              font-family="Arial" font-size="14" dy=".3em">
          ${title}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleGenerateProducts = async () => {
    // In edit mode, we don't need a new file upload
    const isEditMode = params.id && location.state?.productData;
    const hasFrontImage = frontDesignImageSrc || frontDesignUrl || (isEditMode && location.state?.productData?.originalDesignImage);
    const hasBackImage = backDesignImageSrc || backDesignUrl;
    const hasAnyImage = hasFrontImage || hasBackImage;
    
    if ((!frontDesignFile && !isEditMode) || !designTitle || !hasAnyImage) {
      alert('Please upload at least a front design and add a title');
      return;
    }

    setLoading(true);
    
    try {
      // Get all enabled products
      const enabledProducts = PRODUCT_TEMPLATES.filter(p => productConfigs[p.id]?.enabled);
      
      if (enabledProducts.length === 0) {
        alert('Please enable at least one product');
        setLoading(false);
        return;
      }
      
      console.log('🎨 🎨 🎨 GENERATING REAL PRODUCT IMAGES 🎨 🎨 🎨');
      console.log('Enabled products:', enabledProducts.length);
      console.log('Products to process:', enabledProducts.map(p => `${p.name} (${p.colors?.length || 0} colors)`));
      
      // Generate REAL product images for all enabled products using their default colors
      const mockups = {};
      const totalVariants = enabledProducts.length; // One image per enabled product
      
      // Initialize progress
      setGenerationProgress({
        current: 0,
        total: totalVariants,
        message: 'Starting image generation...'
      });
      
      let processedVariants = 0;
      
      for (const product of enabledProducts) {
        const config = productConfigs[product.id];
        
        // Use the selected default color for this product
        const selectedColor = config.selectedColor || product.colors?.[0] || 'Black';
        
        // Determine which image to use based on print location
        let designImage;
        if (config.printLocation === 'back') {
          designImage = backDesignUrl || backDesignImageSrc;
        } else {
          // For 'front' and 'both', use front image for preview
          designImage = frontDesignUrl || frontDesignImageSrc || (isEditMode && location.state?.productData?.originalDesignImage);
        }
        
        if (designImage) {
          // Get current position for this product
          const currentPosition = getCurrentPosition(product.id);
          
          console.log(`🎨 🎨 REAL IMAGE: Generating ${product.name} in ${selectedColor}...`);
          
          // Update progress message
          setGenerationProgress({
            current: processedVariants,
            total: totalVariants,
            message: `Generating ${product.name} in ${selectedColor}...`
          });
          
          try {
            // Generate real composite image using canvas
            const realImage = await canvasImageGenerator.generateProductImage(
              designImage,
              product.templateId,
              selectedColor,
              currentPosition,
              designScale / 100
            );
            
            console.log(`✅ Generated real image for ${product.name} in ${selectedColor}:`, realImage.url ? 'SUCCESS' : 'FAILED');
            
            // Store the product with its generated image
            mockups[product.id] = {
              templateId: product.templateId,
              name: product.name,
              color: selectedColor,
              image: realImage.url,
              real: realImage.real || false,
              width: realImage.width,
              height: realImage.height,
              url: realImage.url
            };
            
            processedVariants++;
            
            // Update progress after successful generation
            setGenerationProgress({
              current: processedVariants,
              total: totalVariants,
              message: `Generated ${product.name} in ${selectedColor}`
            });
            
          } catch (error) {
            console.error(`❌ Failed to generate ${product.name} in ${selectedColor}:`, error);
            // Add fallback for failed generation
            mockups[product.id] = {
              templateId: product.templateId,
              name: product.name,
              color: selectedColor,
              image: null,
              error: error.message,
              url: null
            };
          }
        }
      }
      
      console.log('✅ Generated real product images for all variants:', mockups);
      
      // Upload generated images to Cloudinary
      console.log('📤 Uploading generated images to Cloudinary...');
      setGenerationProgress({
        current: processedVariants,
        total: totalVariants,
        message: 'Uploading images to cloud storage...'
      });
      
      try {
        for (const [productId, mockupData] of Object.entries(mockups)) {
          if (mockupData.image && !mockupData.error) {
            setGenerationProgress(prev => ({
              ...prev,
              message: `Uploading ${mockupData.name} image to cloud...`
            }));
            
            const response = await fetch(`${getApiBaseURL()}/mockups/upload-single-image`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                productName: `${designTitle}-${mockupData.name}-${mockupData.color}`,
                imageUrl: mockupData.image,
                productId: productId,
                color: mockupData.color
              })
            });
            
            if (response.ok) {
              const uploadResult = await response.json();
              console.log(`✅ Uploaded image for ${mockupData.name} in ${mockupData.color} to Cloudinary:`, uploadResult.cloudinaryUrl);
              
            } else {
              console.error(`❌ Failed to upload image for ${mockupData.name} in ${mockupData.color} to Cloudinary`);
            }
          }
        }
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        // Continue even if upload fails - we still have the base64 images
      }
      
      // Use front design as the primary preview image
      const finalDesignImage = frontDesignUrl || frontDesignImageSrc || (isEditMode && location.state?.productData?.originalDesignImage);
      
      // Navigate to products page with the generated data
      navigate('/products', { 
        state: { 
          mockups,
          designTitle,
          designDescription,
          supportingText,
          tags,
          nfcEnabled: nfcExperienceType !== 'none',
          productConfigs, // Pass product configs with selected colors
          designImageSrc: finalDesignImage, // Use the final design image
          frontDesignImageSrc,
          backDesignImageSrc,
          frontDesignUrl,
          backDesignUrl,
          printMethod, // Pass the selected print method
          isEditMode: params.id && location.state?.productData, // Add edit mode flag
          editProductId: params.id // Pass the product ID if editing
        } 
      });
      
    } catch (error) {
      console.error('Error generating products:', error);
      alert('Failed to generate products');
    } finally {
      setLoading(false);
      // Clear progress
      setGenerationProgress({
        current: 0,
        total: 0,
        message: ''
      });
    }
  };

  const filteredColors = COLOR_PALETTE.filter(color => {
    if (colorFilter === 'All') return true;
    if (colorFilter === 'Light') return ['White', 'Natural', 'Light Grey', 'Pink', 'Cotton Candy', 'Gold', 'Mint'].includes(color.name);
    if (colorFilter === 'Dark') return ['Black', 'Dark Grey', 'Navy', 'Cardinal Red', 'Alpine Green', 'Army Heather', 'Royal Heather'].includes(color.name);
    if (colorFilter === 'None') return false;
    return true;
  });

  return (
    <div className="design-editor-page">
      <div className="design-editor-header">
        <h1>TRESR Design Editor</h1>
        <p>Exact TeePublic-style product positioning system</p>
      </div>

      <div className="container">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Upload a Design</h2>
          {/* Show both front and back previews when editing */}
          {params.id && location.state?.productData && backDesignImageSrc ? (
            <div className="design-previews-grid">
              <div className="design-preview-item">
                <h3>Front Design</h3>
                <div {...getRootProps()} className={`upload-area has-design`}>
                  <input {...getInputProps()} />
                  <img src={frontDesignImageSrc} alt="Front design preview" className="design-preview" />
                </div>
              </div>
              <div className="design-preview-item">
                <h3>Back Design</h3>
                <div className="upload-area has-design">
                  <img src={backDesignImageSrc} alt="Back design preview" className="design-preview" />
                </div>
              </div>
            </div>
          ) : (
            <div {...getRootProps()} className={`upload-area ${designImage ? 'has-design' : ''}`}>
              <input {...getInputProps()} />
              {designImageSrc ? (
                <img src={designImageSrc} alt="Design preview" className="design-preview" />
              ) : (
                <div>
                  <p>Click to upload or drag & drop your design</p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
                    PNG, JPG, SVG files accepted
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Image Quality Warning */}
          {imageQualityWarning && (
            <div className="quality-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <p className="warning-message">{imageQualityWarning.message}</p>
                <p className="warning-recommendation">
                  <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer">
                    Upscale your image here →
                  </a>
                </p>
              </div>
            </div>
          )}
          
          {/* Design Guidelines */}
          <div className="design-guidelines">
            <h3>📐 Design Requirements</h3>
            <ul>
              <li>Minimum width: 1500px</li>
              <li>File type: PNG with transparent background</li>
              <li>Resolution: 150 PPI or higher</li>
              <li>Color mode: RGB</li>
            </ul>
            <a href="/print-guidelines" target="_blank" className="guidelines-link">
              View full print guidelines →
            </a>
          </div>
          
          <div className="design-info">
            <div className="form-group">
              <label>Design Title</label>
              <input
                type="text"
                value={designTitle}
                onChange={(e) => setDesignTitle(e.target.value)}
                placeholder="Awesome Forest Scene"
              />
            </div>
            <div className="form-group">
              <label>Print Method</label>
              <select
                value={printMethod}
                onChange={(e) => setPrintMethod(e.target.value)}
                className="print-method-select"
              >
                <option value="auto">Use What's Best (Recommended)</option>
                <option value="dtg">DTG Printing</option>
                <option value="dtf">DTF Printing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="nature, animals, landscape, forest"
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label>Description</label>
              <textarea
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="A beautiful forest landscape with a majestic lion, perfect for nature lovers and wildlife enthusiasts."
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 3' }}>
              <label>Supporting Text</label>
              <input
                type="text"
                value={supportingText}
                onChange={(e) => setSupportingText(e.target.value)}
                placeholder="This design captures the raw beauty of African wildlife in their natural habitat."
              />
            </div>
          </div>
        </div>

        {/* Configure Products Section */}
        <div className="configure-section">
          <h2>Configure Products</h2>
          <div className="product-grid">
            {PRODUCT_TEMPLATES.map(product => (
              <div 
                key={product.id}
                className={`product-card ${productConfigs[product.id]?.enabled ? 'active' : ''} ${activeProduct === product.id ? 'editing' : ''}`}
                onClick={() => setActiveProduct(product.id)}
              >
                {activeProduct === product.id && <div className="currently-editing">Currently Editing</div>}
                {productConfigs[product.id]?.enabled && (
                  <div className="product-checkbox">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect width="16" height="16" rx="3" fill="#10b981"/>
                      <path d="M4 8L7 11L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="product-icon">{PRODUCT_ICONS[product.id]}</div>
                <div className="product-name">{product.name}</div>
                <button 
                  className="product-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductToggle(product.id);
                  }}
                >
                  {productConfigs[product.id]?.enabled ? 'Remove' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {(frontDesignImage || backDesignImage) && (
          <>
            {/* Editor Layout */}
            <div className="editor-layout">
              {/* Canvas Section */}
              <div className="canvas-section">
                {/* View Controls */}
                {activeProduct && productConfigs[activeProduct]?.enabled && 
                 !['art-sqsm', 'art-sqm', 'art-lg', 'nft'].includes(activeProduct) && (
                  <div className="view-controls">
                    {/* Front/Back Toggle - Only show when "Print on Front & Back" is selected */}
                    {productConfigs[activeProduct]?.printLocation === 'both' && (
                      <div className="view-toggle">
                        <button 
                          className={`view-btn ${viewSide === 'front' ? 'active' : ''}`}
                          onClick={() => setViewSide('front')}
                        >
                          Front
                        </button>
                        <button 
                          className={`view-btn ${viewSide === 'back' ? 'active' : ''}`}
                          onClick={() => setViewSide('back')}
                        >
                          Back
                        </button>
                      </div>
                    )}
                    {/* Add back image button - show when viewing back side OR when "Print on Back" is selected */}
                    {((productConfigs[activeProduct]?.printLocation === 'back' && !backDesignImage) ||
                      (productConfigs[activeProduct]?.printLocation === 'both' && viewSide === 'back' && !backDesignImage)) && (
                      <label className="add-back-image-btn">
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            setBackDesignFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                // Check back image dimensions
                                if (img.width < 1500) {
                                  setImageQualityWarning({
                                    type: 'warning',
                                    message: `Your back image is ${img.width}px wide. We recommend at least 1500px for best print quality.`,
                                    currentWidth: img.width,
                                    recommendedWidth: 1500
                                  });
                                } else if (imageQualityWarning?.message?.includes('back')) {
                                  setImageQualityWarning(null);
                                }
                                
                                setBackDesignImage(img);
                                setBackDesignImageSrc(event.target.result);
                                
                                // Upload back design
                                mockupService.uploadDesign(event.target.result)
                                  .then(url => {
                                    setBackDesignUrl(url);
                                    console.log('Back design uploaded:', url);
                                  })
                                  .catch(err => {
                                    console.error('Failed to upload back design:', err);
                                    setBackDesignUrl(event.target.result);
                                  });
                              };
                              img.src = event.target.result;
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        Add back image
                      </label>
                    )}
                    {/* Replace back image button - show when back image exists */}
                    {((productConfigs[activeProduct]?.printLocation === 'back' && backDesignImage) ||
                      (productConfigs[activeProduct]?.printLocation === 'both' && viewSide === 'back' && backDesignImage)) && (
                      <label className="replace-image-btn">
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            setBackDesignFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                // Check back image dimensions
                                if (img.width < 1500) {
                                  setImageQualityWarning({
                                    type: 'warning',
                                    message: `Your back image is ${img.width}px wide. We recommend at least 1500px for best print quality.`,
                                    currentWidth: img.width,
                                    recommendedWidth: 1500
                                  });
                                } else if (imageQualityWarning?.message?.includes('back')) {
                                  setImageQualityWarning(null);
                                }
                                
                                setBackDesignImage(img);
                                setBackDesignImageSrc(event.target.result);
                                
                                // Upload back design
                                mockupService.uploadDesign(event.target.result)
                                  .then(url => {
                                    setBackDesignUrl(url);
                                    console.log('Back design replaced:', url);
                                  })
                                  .catch(err => {
                                    console.error('Failed to upload back design:', err);
                                    setBackDesignUrl(event.target.result);
                                  });
                              };
                              img.src = event.target.result;
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5 13l4 4L19 7" stroke="none"/>
                          <path d="M21 19v-14l-9 6-3-2-6 4v6h18z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                        Replace back image
                      </label>
                    )}
                  </div>
                )}
                <div className="canvas-container">
                  {isGeneratingMockup && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      zIndex: 10
                    }}>
                      Generating mockup...
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="product-canvas"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseEnter={() => setShowBoundingBox(true)}
                    onMouseLeave={() => {
                      handleCanvasMouseUp();
                      setShowBoundingBox(false);
                      if (canvasRef.current) canvasRef.current.style.cursor = 'default';
                    }}
                  />
                </div>
                
                <div className="tools-section">
                  <div className="tools-header">
                    <h3>Tools</h3>
                    <div className="tools-grid">
                      <button 
                        className="tool-btn align-top"
                        onClick={() => {
                          // Top align - only move vertically to top of print area
                          const config = productConfigs[activeProduct];
                          const currentPos = getCurrentPosition();
                          const printAreaTop = 50 + currentPos.height / 2; // Top edge of print area
                          updateCurrentPosition(activeProduct, {
                            ...currentPos,
                            y: printAreaTop // Only change Y, keep X the same
                          });
                        }}
                        title="Align to top"
                      >
                        <div className="icon-top-align">
                          <div className="icon-t-shape">
                            <div className="icon-t-top"></div>
                            <div className="icon-t-stem"></div>
                          </div>
                        </div>
                      </button>
                      <button 
                        className="tool-btn align-center"
                        onClick={() => {
                          // Center align - only move horizontally to center
                          const currentPos = getCurrentPosition();
                          updateCurrentPosition(activeProduct, {
                            ...currentPos,
                            x: 200 // Only change X to center, keep Y the same
                          });
                        }}
                        title="Center horizontally"
                      >
                        <div className="icon-center-align">
                          <div className="icon-plus">
                            <div className="icon-plus-v"></div>
                            <div className="icon-plus-h"></div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="scale-control">
                    <label>Scale</label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={designScale}
                      onChange={handleScaleChange}
                      className="scale-slider"
                    />
                    <input
                      type="number"
                      min="50"
                      max="200"
                      value={designScale}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100;
                        const clampedValue = Math.max(50, Math.min(200, value));
                        handleScaleChange({ target: { value: clampedValue } });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        }
                      }}
                      className="scale-input"
                    />
                    <span className="scale-suffix">%</span>
                  </div>
                </div>
              </div>

              {/* Product Configuration */}
              <div className="product-config">
                <div className="config-header-row">
                  <div className="header-item">Item</div>
                  <div className="header-enable">Enable</div>
                  <div className="header-color">Default Color</div>
                </div>
                
                <div className="product-list">
                  {PRODUCT_TEMPLATES.filter(product => productConfigs[product.id]?.enabled).map(product => (
                    <div key={product.id} className="product-section">
                      <div className={`product-item ${activeProduct === product.id ? 'active' : ''}`}>
                        <div 
                          className="product-name"
                          onClick={() => setActiveProduct(product.id)}
                        >
                          {product.name}
                        </div>
                        <div className="product-toggle">
                          <div 
                            className={`toggle-switch ${productConfigs[product.id]?.enabled ? 'active' : ''}`}
                            onClick={() => handleProductToggle(product.id)}
                          />
                          <span className="toggle-label">
                            {productConfigs[product.id]?.enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <select 
                          className="color-dropdown"
                          value={productConfigs[product.id]?.selectedColor || ''}
                          onChange={(e) => {
                            setProductConfigs(prev => ({
                              ...prev,
                              [product.id]: {
                                ...prev[product.id],
                                defaultColor: e.target.value,
                                selectedColor: e.target.value
                              }
                            }));
                          }}
                        >
                          <option value="">Select Default Color</option>
                          {product.colors.map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                      {product.id !== 'art-sqsm' && product.id !== 'art-sqm' && product.id !== 'art-lg' && product.id !== 'nft' && (
                        <div className="print-location-options">
                          <label>
                            <input
                              type="radio"
                              name={`print-location-${product.id}`}
                              value="front"
                              checked={productConfigs[product.id]?.printLocation === 'front'}
                              onChange={(e) => {
                                setProductConfigs(prev => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    printLocation: e.target.value
                                  }
                                }));
                                // Auto-select front view when switching to front only
                                if (product.id === activeProduct && e.target.value === 'front') {
                                  setViewSide('front');
                                }
                              }}
                            />
                            <span>Print on Front</span>
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`print-location-${product.id}`}
                              value="back"
                              checked={productConfigs[product.id]?.printLocation === 'back'}
                              onChange={(e) => {
                                setProductConfigs(prev => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    printLocation: e.target.value
                                  }
                                }));
                                // Auto-select back view when switching to back only
                                if (product.id === activeProduct && e.target.value === 'back') {
                                  setViewSide('back');
                                }
                              }}
                            />
                            <span>Print on Back</span>
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`print-location-${product.id}`}
                              value="both"
                              checked={productConfigs[product.id]?.printLocation === 'both'}
                              onChange={(e) => {
                                setProductConfigs(prev => ({
                                  ...prev,
                                  [product.id]: {
                                    ...prev[product.id],
                                    printLocation: e.target.value
                                  }
                                }));
                              }}
                            />
                            <span>Print on Front & Back</span>
                          </label>
                        </div>
                      )}
                      
                      {/* Color Swatches for each product */}
                      <div className="color-swatches-section">
                        <div className="color-grid">
                          {product.colors.map(color => {
                            const colorHex = COLOR_PALETTE.find(c => c.name === color)?.hex || '#000000';
                            const isSelected = productConfigs[product.id]?.selectedColors?.includes(color) || false;
                            
                            return (
                              <div
                                key={color}
                                className={`color-swatch ${isSelected ? 'selected' : ''}`}
                                style={{ backgroundColor: colorHex }}
                                title={color}
                                onClick={() => {
                                  // Only add/remove from selectedColors list - don't change canvas background
                                  setProductConfigs(prev => ({
                                    ...prev,
                                    [product.id]: {
                                      ...prev[product.id],
                                      selectedColors: isSelected
                                        ? prev[product.id]?.selectedColors?.filter(c => c !== color) || []
                                        : [...(prev[product.id]?.selectedColors || []), color]
                                      // Don't set selectedColor here - that's controlled by dropdown
                                    }
                                  }));
                                }}
                                onMouseEnter={() => {
                                  // Temporarily show this color on the garment if it's the active product
                                  if (product.id === activeProduct) {
                                    setProductConfigs(prev => ({
                                      ...prev,
                                      [product.id]: {
                                        ...prev[product.id],
                                        hoverColor: color // Temporary hover color
                                      }
                                    }));
                                  }
                                }}
                                onMouseLeave={() => {
                                  // Remove hover color when mouse leaves - returns to dropdown default color
                                  if (product.id === activeProduct) {
                                    setProductConfigs(prev => ({
                                      ...prev,
                                      [product.id]: {
                                        ...prev[product.id],
                                        hoverColor: null // Clear hover color, returns to dropdown selectedColor/defaultColor
                                      }
                                    }));
                                  }
                                }}
                              >
                                {isSelected && <span className="checkmark">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>



            {/* NFC Experience Section */}
            <div className="nfc-section">
              <div className="nfc-header">
                <h2>🔗 Connect an NFC Experience</h2>
              </div>
              <p className="nfc-subtitle">Turn your product into smart apparel with built-in NFC features.</p>
              
              <div className="coming-soon-badge">
                ⚠️ Coming Soon...
              </div>
              
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                This feature is almost ready. Soon, you'll be able to attach powerful interactive experiences directly to your products using TRESR's NFC tech.
              </p>
              
              <div className="nfc-info">
                <h3>💡 What's an NFC Experience?</h3>
                <p>TRESR products are smart apparel.</p>
                <p>When scanned, they can unlock exclusive content, verify NFT ownership, assign reward points, redirect to custom destinations, and more — all powered by encrypted NFC tags.</p>
              </div>
              
            </div>

            {/* Ready to Generate Section */}
            <div className="ready-section">
              <div className="button-group">
                {params.id && location.state?.productData ? (
                  // Edit mode - show different buttons based on publish status
                  isProductPublished ? (
                    // Published product buttons
                    <>
                      <button 
                        className="btn-unpublish"
                        onClick={handleUnpublishToDraft}
                        style={{backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer'}}
                      >
                        Unpublish to Draft
                      </button>
                      <button
                        className="btn-update"
                        onClick={handleUpdateDesign}
                        disabled={loading || !designTitle || calculateTotalVariants() === 0}
                        style={{backgroundColor: '#3498db', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer'}}
                      >
                        {loading ? 'Updating...' : 'Update Design'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={handleDeleteProduct}
                        style={{backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer'}}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    // Draft product buttons
                    <>
                      <button 
                        className="btn-save"
                        onClick={handleSaveForLater}
                        disabled={!designTitle}
                      >
                        Save for Later
                      </button>
                      <button
                        className="btn-publish"
                        onClick={handleGenerateProducts}
                        disabled={loading || !designTitle || calculateTotalVariants() === 0}
                      >
                        {loading ? 'Publishing...' : 'Publish'}
                      </button>
                    </>
                  )
                ) : (
                  // New product creation buttons
                  <>
                    <button 
                      className="btn-save"
                      onClick={handleSaveForLater}
                      disabled={!designFile || !designTitle}
                    >
                      Save for Later
                    </button>
                    <button
                      className="btn-publish"
                      onClick={handleGenerateProducts}
                      disabled={loading || !designTitle || calculateTotalVariants() === 0}
                    >
                      {loading ? 'Publishing...' : 'Publish'}
                    </button>
                  </>
                )}
              </div>
              
              {/* Progress Bar */}
              {loading && generationProgress.total > 0 && (
                <div className="generation-progress">
                  <div className="progress-message">{generationProgress.message}</div>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${(generationProgress.current / generationProgress.total) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      {generationProgress.current} / {generationProgress.total} images
                    </div>
                  </div>
                </div>
              )}
              
              <div className="generate-info">
                {params.id && location.state?.productData ? (
                  isProductPublished ? (
                    <>
                      <h3>Published Design</h3>
                      <p>This design is live. You can unpublish to draft, update with changes, or delete permanently.</p>
                    </>
                  ) : (
                    <>
                      <h3>Draft Design</h3>
                      <p>Save changes to draft or publish to make it live.</p>
                    </>
                  )
                ) : (
                  <>
                    <h3>Ready to Generate</h3>
                    <p>Your design will be applied to all enabled products with their individual positioning.</p>
                  </>
                )}
                <div className="variant-count">{calculateTotalVariants()}</div>
                <div className="variant-label">Total Product Variants</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DesignEditor;