import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import mockupService from '../services/mockupService';
import { getGarmentImage as getCloudinaryImage } from '../config/garmentImagesCloudinary';
import './DesignEditor.css';

// Map product IDs to actual Sanity SKUs we migrated
const PRODUCT_TEMPLATES = [
  // Core Apparel
  { id: 'tee', name: 'Medium Weight T-Shirt', templateId: 'tshirt_front', price: 22, colors: ['Black', 'White', 'Navy', 'Heather Grey', 'Natural', 'Red'] },
  { id: 'boxy', name: 'Oversized Drop Shoulder', templateId: 'tshirt_boxy_front', price: 26, colors: ['Black', 'Natural'] },
  { id: 'next-crop', name: 'Next Level Crop Top', templateId: 'croptop_front', price: 24, colors: ['Black', 'White', 'Gold', 'Blue', 'Dark Heather Gray'] },
  
  // Hoodies & Sweatshirts
  { id: 'wmn-hoodie', name: "Women's Independent Hoodie", templateId: 'hoodie_front', price: 42, colors: ['Black', 'Black Camo', 'Pink', 'Bone', 'Cotton Candy', 'Gray Heather', 'Sage', 'White'] },
  { id: 'med-hood', name: 'Medium Weight Hoodie', templateId: 'hoodie_front', price: 42, colors: ['Black', 'Gold', 'Gray Heather', 'Red', 'Alpine Green'] },
  { id: 'mediu', name: 'Medium Weight Sweatshirt', templateId: 'crewneck_front', price: 36, colors: ['Black', 'Charcoal', 'Classic Navy', 'Gray Heather', 'White'] },
  { id: 'sweat', name: 'Standard Sweatshirt', templateId: 'crewneck_front', price: 34, colors: ['Black'] },
  
  // Hats
  { id: 'patch-c', name: 'Patch Hat - Curved', templateId: 'hat_front', price: 22, colors: ['Black', 'Gray'] },
  { id: 'patch-flat', name: 'Patch Hat - Flat', templateId: 'hat_flat', price: 24, colors: ['Black', 'Navy'] },
  
  // Art Canvas
  { id: 'art-sqsm', name: 'Art Canvas - 12x12', templateId: 'canvas_square', price: 35, colors: ['White'] },
  { id: 'art-sqm', name: 'Art Canvas - 16x16', templateId: 'canvas_square', price: 45, colors: ['White'] },
  { id: 'art-lg', name: 'Art Canvas - 24x24', templateId: 'canvas_square', price: 65, colors: ['White'] },
  
  // Other
  { id: 'polo', name: 'Standard Polo', templateId: 'polo_front', price: 28, colors: ['Black'] },
  { id: 'nft', name: 'NFTREASURE NFT Cards', templateId: 'trading_card', price: 5, colors: ['Default'] }
];

const COLOR_PALETTE = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Forest Green', hex: '#228B22' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Turquoise', hex: '#40E0D0' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Light Blue', hex: '#ADD8E6' },
  { name: 'Light Gray', hex: '#D3D3D3' },
  { name: 'Charcoal', hex: '#36454F' }
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
  
  const [designImage, setDesignImage] = useState(null);
  const [designImageSrc, setDesignImageSrc] = useState(null);
  const [designFile, setDesignFile] = useState(null);
  const [designUrl, setDesignUrl] = useState(null);
  const [designTitle, setDesignTitle] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [tags, setTags] = useState('');
  const [matureContent, setMatureContent] = useState(false);
  const [currentMockup, setCurrentMockup] = useState(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  
  const [activeProduct, setActiveProduct] = useState(PRODUCT_TEMPLATES[0].id);
  const [productConfigs, setProductConfigs] = useState(() => {
    const configs = {};
    PRODUCT_TEMPLATES.forEach(product => {
      const printArea = PRINT_AREAS[product.id] || { x: 200, y: 80 };
      configs[product.id] = {
        enabled: product.id === 'tee' || product.id === 'wmn-hoodie',
        position: { x: printArea.x, y: printArea.y, width: 150, height: 150 }, // Will be updated with correct aspect ratio when image loads
        defaultColor: product.colors[0],
        selectedColor: product.colors[0]
      };
    });
    return configs;
  });
  
  const [selectedColors, setSelectedColors] = useState(['Black', 'White']);
  const [colorFilter, setColorFilter] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(100);
  const [loading, setLoading] = useState(false);
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
        setDesignImage(img);
        setDesignImageSrc(e.target.result);
        
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
            
            newConfigs[productId] = {
              ...prev[productId],
              position: {
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
          setDesignUrl(url);
          console.log('Design uploaded:', url);
        })
        .catch(err => {
          console.error('Failed to upload design:', err);
          // Continue without URL for now
          setDesignUrl(e.target.result);
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
      // Convert canvas position to API format
      const apiPosition = mockupService.convertToApiPosition(
        { x: config.position.x, y: config.position.y },
        { width: 400, height: 400 }
      );
      
      const apiScale = mockupService.calculateApiScale(
        { width: config.position.width, height: config.position.height },
        { width: 400, height: 400 },
        designScale / 100
      );
      
      const mockup = await mockupService.generatePreview(
        designUrl,
        product.templateId,
        config.selectedColor || config.defaultColor,
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

  const drawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = productConfigs[activeProduct];
    
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
    const selectedColor = config?.selectedColor || config?.defaultColor || 'Black';
    const garmentImageUrl = getCloudinaryImage(activeProduct, selectedColor);
    
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
    if (designImage && config && config.position) {
      ctx.save();
      
      // Clip to print area
      ctx.beginPath();
      ctx.rect(printAreaX, printAreaY, printAreaWidth, printAreaHeight);
      ctx.clip();
      
      const { x, y, width, height } = config.position;
      
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
    if (designImage && config && config.position && showBoundingBox) {
      const { x, y, width, height } = config.position;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - width/2, y - height/2, width, height);
    }
  };

  React.useEffect(() => {
    drawCanvas();
  }, [activeProduct, productConfigs, designImage, showBoundingBox, isDragging]);
  
  // Load garment image when product or color changes
  React.useEffect(() => {
    const config = productConfigs[activeProduct];
    const selectedColor = config?.selectedColor || config?.defaultColor || 'Black';
    const garmentImageUrl = getCloudinaryImage(activeProduct, selectedColor);
    
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
  }, [activeProduct, productConfigs[activeProduct]?.selectedColor]);

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
      
      // Load selected colors
      if (productData.selectedColors) {
        setSelectedColors(productData.selectedColors);
      }
      
      // Load product configurations with positions (do this after image loads)
      if (productData.productConfigs) {
        console.log('Loading product configs:', productData.productConfigs);
        setProductConfigs(productData.productConfigs);
      }
      
      // Load NFC settings
      if (productData.nfcEnabled !== undefined) {
        setNfcExperienceType(productData.nfcEnabled ? 'default' : 'none');
      }
      
      // Set product publish status
      setIsProductPublished(!productData.isDraft);
      
      // Try to load the original design image
      const designImageToLoad = productData.originalDesignImage || 
                                productData.previewImage || 
                                (productData.mockups && productData.mockups.length > 0 && 
                                 productData.mockups.find(m => m.designPreview)?.designPreview);
      
      if (designImageToLoad) {
        const img = new Image();
        img.onload = () => {
          setDesignImage(img);
          setDesignImageSrc(designImageToLoad);
          
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
                  position: {
                    ...prev[productId].position,
                    width: baseWidth,
                    height: baseHeight
                  }
                };
              });
              return newConfigs;
            });
          }
        };
        img.src = designImageToLoad;
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
    }
  }, [params.id, location.state]);

  const handleCanvasMouseDown = (e) => {
    if (!designImage) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const config = productConfigs[activeProduct];
    
    // Check if click is on the design
    const { x: cx, y: cy, width, height } = config.position;
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
      const config = productConfigs[activeProduct];
      const { x: cx, y: cy, width, height } = config.position;
      
      if (x >= cx - width/2 && x <= cx + width/2 && y >= cy - height/2 && y <= cy + height/2) {
        canvasRef.current.style.cursor = 'move';
      } else {
        canvasRef.current.style.cursor = 'default';
      }
    }
    
    // Handle dragging
    if (isDragging) {
      const printArea = PRINT_AREAS[activeProduct] || { width: 200, height: 286, x: 200, y: 80 };
      const config = productConfigs[activeProduct];
      const halfWidth = config.position.width / 2;
      const halfHeight = config.position.height / 2;
      
      // Calculate boundaries based on print area
      const minX = (printArea.x - printArea.width/2) + halfWidth;
      const maxX = (printArea.x + printArea.width/2) - halfWidth;
      const minY = (printArea.y - printArea.height/2) + halfHeight;
      const maxY = (printArea.y + printArea.height/2) - halfHeight;
      
      setProductConfigs(prev => ({
        ...prev,
        [activeProduct]: {
          ...prev[activeProduct],
          position: {
            ...prev[activeProduct].position,
            x: Math.max(minX, Math.min(maxX, x - dragStart.x)),
            y: Math.max(minY, Math.min(maxY, y - dragStart.y))
          }
        }
      }));
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
    
    setProductConfigs(prev => ({
      ...prev,
      [activeProduct]: {
        ...prev[activeProduct],
        position: {
          ...prev[activeProduct].position,
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

  const handleColorToggle = (colorName) => {
    setSelectedColors(prev => {
      if (prev.includes(colorName)) {
        return prev.filter(c => c !== colorName);
      }
      return [...prev, colorName];
    });
  };

  const calculateTotalVariants = () => {
    const enabledProducts = Object.entries(productConfigs)
      .filter(([_, config]) => config.enabled);
    const colors = selectedColors.length > 0 ? selectedColors.length : 20; // Default to 20 colors
    const sizes = 8; // Standard sizes S-5XL
    return enabledProducts.length * colors * sizes;
  };

  const handleUnpublishToDraft = async () => {
    if (!window.confirm('Unpublish this design to draft? It will no longer be live.')) {
      return;
    }
    
    try {
      const isEditMode = params.id && location.state?.productData;
      if (!isEditMode) return;
      
      // Update the product to draft status
      const savedProducts = JSON.parse(localStorage.getItem('generatedProducts') || '[]');
      const index = savedProducts.findIndex(p => p.id === params.id);
      
      if (index !== -1) {
        savedProducts[index].isDraft = true;
        localStorage.setItem('generatedProducts', JSON.stringify(savedProducts));
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
      const savedProducts = JSON.parse(localStorage.getItem('generatedProducts') || '[]');
      const updatedProducts = savedProducts.filter(p => p.id !== params.id);
      localStorage.setItem('generatedProducts', JSON.stringify(updatedProducts));
      
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
      const savedProduct = {
        id: isEditMode ? params.id : `draft_${timestamp}_${randomSuffix}`,
        name: designTitle,
        description: designDescription,
        supportingText: supportingText, // Save supporting text
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        nfcEnabled: nfcExperienceType !== 'none',
        originalDesignImage: designImageSrc, // Store original for editing
        previewImage: designImageSrc, // Store for product card display
        designUrl: designUrl,
        productConfigs: productConfigs, // Save product positions and configurations
        selectedColors: selectedColors, // Save selected colors
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
      const savedProducts = JSON.parse(localStorage.getItem('generatedProducts') || '[]');
      
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
      
      localStorage.setItem('generatedProducts', JSON.stringify(savedProducts));
      
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
    const hasDesignImage = designImageSrc || designUrl || (isEditMode && location.state?.productData?.originalDesignImage);
    
    if ((!designFile && !isEditMode) || !designTitle || !hasDesignImage) {
      alert('Please upload a design and add a title');
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
      
      // Use the appropriate design image source
      const designImageForMockups = designUrl || designImageSrc || (isEditMode && location.state?.productData?.originalDesignImage);
      
      console.log('Using design image for mockups:', designImageForMockups ? 'present' : 'missing');
      
      // Generate mockups for all enabled products
      const products = enabledProducts.map(product => ({
        ...product,
        enabled: true,
        selectedColor: productConfigs[product.id].selectedColor || productConfigs[product.id].defaultColor
      }));
      
      const mockups = await mockupService.generateAllMockups(designImageForMockups, products, productConfigs);
      
      console.log('Generated mockups:', mockups);
      
      // Add the actual design image to each mockup for preview
      const finalDesignImage = designImageForMockups;
      Object.keys(mockups).forEach(productId => {
        if (mockups[productId] && finalDesignImage) {
          mockups[productId].designPreview = finalDesignImage;
        }
      });
      
      // Navigate to products page with the generated data
      navigate('/products', { 
        state: { 
          mockups,
          designTitle,
          designDescription,
          supportingText,
          tags,
          nfcEnabled: nfcExperienceType !== 'none',
          productConfigs,
          selectedColors,
          designImageSrc: finalDesignImage, // Use the final design image
          isEditMode: params.id && location.state?.productData, // Add edit mode flag
          editProductId: params.id // Pass the product ID if editing
        } 
      });
      
    } catch (error) {
      console.error('Error generating products:', error);
      alert('Failed to generate products');
    } finally {
      setLoading(false);
    }
  };

  const filteredColors = COLOR_PALETTE.filter(color => {
    if (colorFilter === 'All') return true;
    if (colorFilter === 'Light') return ['White', 'Light Gray', 'Light Blue', 'Beige', 'Pink', 'Yellow', 'Mint'].includes(color.name);
    if (colorFilter === 'Dark') return ['Black', 'Navy', 'Charcoal', 'Forest Green', 'Burgundy', 'Purple', 'Maroon'].includes(color.name);
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
              <label>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="nature, animals, landscape, forest"
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <textarea
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="A beautiful forest landscape with a majestic lion, perfect for nature lovers and wildlife enthusiasts."
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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

        {designImage && (
          <>
            {/* Editor Layout */}
            <div className="editor-layout">
              {/* Canvas Section */}
              <div className="canvas-section">
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
                          const printAreaTop = 50 + config.position.height / 2; // Top edge of print area
                          setProductConfigs(prev => ({
                            ...prev,
                            [activeProduct]: {
                              ...prev[activeProduct],
                              position: {
                                ...prev[activeProduct].position,
                                y: printAreaTop // Only change Y, keep X the same
                              }
                            }
                          }));
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
                          setProductConfigs(prev => ({
                            ...prev,
                            [activeProduct]: {
                              ...prev[activeProduct],
                              position: {
                                ...prev[activeProduct].position,
                                x: 200 // Only change X to center, keep Y the same
                              }
                            }
                          }));
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
                    <span className="scale-value">{designScale}%</span>
                  </div>
                </div>
              </div>

              {/* Product Configuration */}
              <div className="product-config">
                <div className="config-header">
                  <h3>Products</h3>
                  <span>{Object.values(productConfigs).filter(c => c.enabled).length} - Items</span>
                </div>
                
                <div className="product-list">
                  {PRODUCT_TEMPLATES.filter(product => productConfigs[product.id]?.enabled).map(product => (
                    <div 
                      key={product.id} 
                      className={`product-item ${activeProduct === product.id ? 'active' : ''}`}
                    >
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
                        value={productConfigs[product.id]?.selectedColor || productConfigs[product.id]?.defaultColor}
                        onChange={(e) => {
                          setProductConfigs(prev => ({
                            ...prev,
                            [product.id]: {
                              ...prev[product.id],
                              selectedColor: e.target.value
                            }
                          }));
                        }}
                      >
                        {product.colors.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="colors-section">
              <h2>Product Colors</h2>
              <p>Activate the background colors that you want to make available for your enabled products.</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Not all colors are available for all products.</p>
              
              <div className="color-filters">
                <button 
                  className={`color-filter ${colorFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setColorFilter('All')}
                >
                  All
                </button>
                <button 
                  className={`color-filter ${colorFilter === 'Light' ? 'active' : ''}`}
                  onClick={() => setColorFilter('Light')}
                >
                  Light
                </button>
                <button 
                  className={`color-filter ${colorFilter === 'Dark' ? 'active' : ''}`}
                  onClick={() => setColorFilter('Dark')}
                >
                  Dark
                </button>
                <button 
                  className={`color-filter ${colorFilter === 'None' ? 'active' : ''}`}
                  onClick={() => setColorFilter('None')}
                >
                  None
                </button>
              </div>
              
              <div className="color-grid">
                {filteredColors.map(color => (
                  <div
                    key={color.name}
                    className={`color-swatch ${selectedColors.includes(color.name) ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex, border: color.name === 'White' ? '2px solid #e5e7eb' : 'none' }}
                    onClick={() => handleColorToggle(color.name)}
                    title={color.name}
                  />
                ))}
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