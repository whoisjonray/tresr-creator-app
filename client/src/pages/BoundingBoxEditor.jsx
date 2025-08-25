import React, { useState, useRef, useEffect } from 'react';
import { getGarmentImage } from '../config/garmentImagesCloudinary';
import api from '../services/api';
import './BoundingBoxEditor.css';

// Default print areas for 600x600 canvas - using top-left coordinates
const INITIAL_PRINT_AREAS = {
  'tee': { 
    front: { width: 280, height: 350, x: 160, y: 125 },  // Center at 300,300 -> top-left at 160,125
    back: { width: 280, height: 350, x: 160, y: 125 }
  },
  'boxy': { 
    front: { width: 300, height: 350, x: 150, y: 125 },  // Center at 300,300 -> top-left at 150,125
    back: { width: 300, height: 350, x: 150, y: 125 }
  },
  'next-crop': { 
    front: { width: 200, height: 200, x: 200, y: 150 },  // Smaller, higher placement for crop top
    back: { width: 200, height: 200, x: 200, y: 150 }
  },
  'wmn-hoodie': { 
    front: { width: 240, height: 320, x: 180, y: 140 },  // Adjusted for women's fit
    back: { width: 240, height: 320, x: 180, y: 140 }
  },
  'med-hood': { 
    front: { width: 260, height: 340, x: 170, y: 130 },  // Standard hoodie area
    back: { width: 260, height: 340, x: 170, y: 130 }
  },
  'mediu': { 
    front: { width: 260, height: 330, x: 170, y: 135 },  // Sweatshirt area
    back: { width: 260, height: 330, x: 170, y: 135 }
  },
  'polo': { 
    front: { width: 200, height: 250, x: 200, y: 100 },  // Smaller chest area
    back: { width: 200, height: 250, x: 200, y: 100 }
  },
  'patch-c': { 
    front: { width: 120, height: 80, x: 240, y: 260 },  // Centered on canvas
    back: null // Hats typically don't have back print
  },
  'patch-flat': { 
    front: { width: 140, height: 80, x: 230, y: 260 },  // Centered on canvas
    back: null // Hats typically don't have back print
  },
  'mug': { 
    front: { width: 200, height: 200, x: 200, y: 200 },  // Centered
    back: null // Mugs have one print area
  },
  'art-sqsm': { 
    front: { width: 560, height: 560, x: 20, y: 20 },  // Full canvas with margin
    back: null // Canvas art is single-sided
  },
  'art-sqm': { 
    front: { width: 560, height: 560, x: 20, y: 20 },  // Full canvas with margin
    back: null
  },
  'art-lg': { 
    front: { width: 560, height: 560, x: 20, y: 20 },  // Full canvas with margin
    back: null
  },
  'nft': { 
    front: { width: 400, height: 560, x: 100, y: 20 },  // Tall card format
    back: null // Cards are typically single-sided
  },
  'baby-tee': { 
    front: { width: 240, height: 300, x: 180, y: 100 },  // Ladies baby tee - positioned higher
    back: { width: 240, height: 300, x: 180, y: 100 }
  }
};

const BoundingBoxEditor = () => {
  // Will be loaded from API
  const [garmentTypes, setGarmentTypes] = useState([]);
  // Load saved print areas from localStorage or use defaults
  const loadSavedAreas = () => {
    const saved = localStorage.getItem('savedPrintAreas');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's the old flat structure and convert it
      if (parsed.tee && typeof parsed.tee.width === 'number') {
        // Old structure detected, convert to new front/back structure
        const converted = {};
        for (const [garmentId, area] of Object.entries(parsed)) {
          // Check if this garment should have a back side
          const hasBack = !['patch-c', 'patch-flat', 'mug', 'art-sqsm', 'art-sqm', 'art-lg', 'nft'].includes(garmentId);
          converted[garmentId] = {
            front: area,
            back: hasBack ? { ...area } : null
          };
        }
        // Save the converted structure
        localStorage.setItem('savedPrintAreas', JSON.stringify(converted));
        return converted;
      }
      return parsed;
    }
    return INITIAL_PRINT_AREAS;
  };

  const [selectedGarment, setSelectedGarment] = useState(null);
  const [selectedSide, setSelectedSide] = useState('front');
  const [printAreas, setPrintAreas] = useState(loadSavedAreas());
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [garmentImage, setGarmentImage] = useState(null);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const canvasRef = useRef(null);

  // DTG printer platen is 14x20 inches (0.7 ratio)
  const DTG_ASPECT_RATIO = 14 / 20; // 0.7

  // Canvas size
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    // Load saved settings from database on mount
    loadSavedSettings();
    // Load product templates from API
    loadProductTemplates();
  }, []);

  useEffect(() => {
    loadGarmentImage();
  }, [selectedGarment, selectedSide]);

  useEffect(() => {
    drawCanvas();
  }, [garmentImage, printAreas, selectedGarment, selectedSide]);

  const loadProductTemplates = async () => {
    try {
      const response = await api.get('/api/settings/product-templates');
      if (response.data.success && response.data.templates) {
        const templates = response.data.templates.map(t => ({
          id: t.id,
          name: t.name,
          templateId: t.id,
          hasBackPrint: t.hasBackPrint,
          frontImage: t.frontImage,
          backImage: t.backImage,
          colorImages: t.colorImages,
          printAreas: t.printAreas // Include print areas from template
        }));
        setGarmentTypes(templates);
        
        // Add template print areas to the printAreas state
        const newPrintAreas = { ...printAreas };
        templates.forEach(template => {
          if (template.printAreas && !newPrintAreas[template.id]) {
            newPrintAreas[template.id] = template.printAreas;
          }
        });
        setPrintAreas(newPrintAreas);
        
        // Set initial garment if not already set
        if (!selectedGarment && templates.length > 0) {
          setSelectedGarment(templates[0].id);
        }
        
        console.log('Loaded product templates from API:', templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fall back to defaults if API fails
      const fallbackTemplates = [
        { id: 'tee', name: 'Medium Weight T-Shirt', templateId: 'tshirt_front' },
        { id: 'boxy', name: 'Oversized Drop Shoulder', templateId: 'tshirt_boxy_front' },
        { id: 'next-crop', name: 'Next Level Crop Top', templateId: 'croptop_front' },
        { id: 'wmn-hoodie', name: "Women's Independent Hoodie", templateId: 'hoodie_front' },
        { id: 'med-hood', name: 'Medium Weight Hoodie', templateId: 'hoodie_front' },
        { id: 'mediu', name: 'Medium Weight Sweatshirt', templateId: 'crewneck_front' },
        { id: 'polo', name: 'Standard Polo', templateId: 'polo_front' },
        { id: 'patch-c', name: 'Patch Hat - Curved', templateId: 'hat_front' },
        { id: 'patch-flat', name: 'Patch Hat - Flat', templateId: 'hat_flat' },
        { id: 'mug', name: 'Coffee Mug', templateId: 'mug_front' },
        { id: 'art-sqsm', name: 'Art Canvas - 12x12', templateId: 'canvas_square' },
        { id: 'art-sqm', name: 'Art Canvas - 16x16', templateId: 'canvas_square' },
        { id: 'art-lg', name: 'Art Canvas - 24x24', templateId: 'canvas_square' },
        { id: 'nft', name: 'NFTREASURE NFT Cards', templateId: 'trading_card' }
      ];
      setGarmentTypes(fallbackTemplates);
      
      // Set initial garment if not already set
      if (!selectedGarment && fallbackTemplates.length > 0) {
        setSelectedGarment(fallbackTemplates[0].id);
      }
    }
  };

  const loadSavedSettings = async () => {
    try {
      const response = await api.get('/api/settings/print-areas');
      if (response.data.success && response.data.printAreas) {
        const areas = response.data.printAreas;
        // Check if it's the old flat structure and convert it
        if (areas.tee && typeof areas.tee.width === 'number') {
          // Old structure detected, convert to new front/back structure
          const converted = {};
          for (const [garmentId, area] of Object.entries(areas)) {
            const hasBack = !['patch-c', 'patch-flat', 'mug', 'art-sqsm', 'art-sqm', 'art-lg', 'nft'].includes(garmentId);
            converted[garmentId] = {
              front: area,
              back: hasBack ? { ...area } : null
            };
          }
          setPrintAreas(converted);
          console.log('Converted old print areas to new structure');
        } else {
          setPrintAreas(areas);
          console.log('Loaded print areas from database');
        }
      }
    } catch (error) {
      console.log('Using local/default print areas');
    }
  };

  const loadGarmentImage = async () => {
    const garment = garmentTypes.find(g => g.id === selectedGarment);
    if (!garment) return;

    try {
      let imageUrl = null;
      
      // First check if custom template has images
      if (selectedSide === 'front' && garment.frontImage) {
        imageUrl = garment.frontImage;
      } else if (selectedSide === 'back' && garment.backImage) {
        imageUrl = garment.backImage;
      } else if (garment.colorImages?.['White']) {
        // Check for color-specific images
        if (selectedSide === 'front' && garment.colorImages['White'].frontImage) {
          imageUrl = garment.colorImages['White'].frontImage;
        } else if (selectedSide === 'back' && garment.colorImages['White'].backImage) {
          imageUrl = garment.colorImages['White'].backImage;
        }
      }
      
      // Fall back to Cloudinary images for standard garments
      if (!imageUrl) {
        const garmentType = selectedGarment;
        imageUrl = getGarmentImage(garmentType, 'white', selectedSide);
      }
      
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setGarmentImage(img);
        };
        img.onerror = () => {
          console.error('Failed to load image:', imageUrl);
          setGarmentImage(null);
        };
        img.src = imageUrl;
      } else {
        // No image available - clear the garment image
        setGarmentImage(null);
        console.log(`No image available for ${selectedGarment} ${selectedSide}`);
      }
    } catch (error) {
      console.error('Failed to load garment image:', error);
      setGarmentImage(null);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null, cannot draw');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context is null, cannot draw');
      return;
    }
    
    console.log('Drawing canvas with area:', area);
    
    // Clear canvas completely
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw garment image or placeholder
    if (garmentImage) {
      try {
        ctx.drawImage(garmentImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } catch (error) {
        console.error('Error drawing garment image:', error);
        // Fall back to placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    } else {
      // Draw placeholder with text
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Add text to indicate no image
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No garment image available', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('Upload images in Product Template Manager', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // Draw bounding box
    const area = printAreas[selectedGarment]?.[selectedSide];
    if (area) {
      try {
        // Draw semi-transparent fill
        ctx.fillStyle = 'rgba(0, 123, 255, 0.2)';
        ctx.fillRect(area.x, area.y, area.width, area.height);

        // Draw border
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.strokeRect(area.x, area.y, area.width, area.height);

        // Draw resize handles with better visibility
        const handleSize = 12; // Increased for better touch interaction
        ctx.fillStyle = '#007bff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const drawHandle = (x, y) => {
          ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
          ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        };
        
        // Corners
        drawHandle(area.x, area.y);
        drawHandle(area.x + area.width, area.y);
        drawHandle(area.x, area.y + area.height);
        drawHandle(area.x + area.width, area.y + area.height);
        
        // Edges
        drawHandle(area.x + area.width/2, area.y);
        drawHandle(area.x + area.width/2, area.y + area.height);
        drawHandle(area.x, area.y + area.height/2);
        drawHandle(area.x + area.width, area.y + area.height/2);

        // Draw center crosshair with better visibility
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;
        
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY);
        ctx.lineTo(centerX + 15, centerY);
        ctx.moveTo(centerX, centerY - 15);
        ctx.lineTo(centerX, centerY + 15);
        ctx.stroke();

        // Draw dimensions with better contrast
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.font = 'bold 14px monospace';
        
        const dimensionText = `${Math.round(area.width)} x ${Math.round(area.height)}`;
        const positionText = `(${Math.round(area.x)}, ${Math.round(area.y)})`;
        
        // Draw text outline for better visibility
        ctx.strokeText(dimensionText, area.x, area.y - 10);
        ctx.fillText(dimensionText, area.x, area.y - 10);
        
        ctx.strokeText(positionText, area.x, area.y + area.height + 20);
        ctx.fillText(positionText, area.x, area.y + area.height + 20);
        
      } catch (error) {
        console.error('Error drawing bounding box:', error);
      }
    }
    
    console.log('Canvas drawn successfully', { selectedGarment, selectedSide, hasArea: !!area, hasImage: !!garmentImage });
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getResizeHandle = (pos) => {
    const area = printAreas[selectedGarment]?.[selectedSide];
    if (!area) return null;
    const handleSize = 12; // Increased for better touch interaction
    const tolerance = 8; // Increased tolerance for easier interaction

    // Check corners
    if (Math.abs(pos.x - area.x) < tolerance && Math.abs(pos.y - area.y) < tolerance) return 'nw';
    if (Math.abs(pos.x - (area.x + area.width)) < tolerance && Math.abs(pos.y - area.y) < tolerance) return 'ne';
    if (Math.abs(pos.x - area.x) < tolerance && Math.abs(pos.y - (area.y + area.height)) < tolerance) return 'sw';
    if (Math.abs(pos.x - (area.x + area.width)) < tolerance && Math.abs(pos.y - (area.y + area.height)) < tolerance) return 'se';
    
    // Check edges
    if (Math.abs(pos.x - (area.x + area.width/2)) < tolerance && Math.abs(pos.y - area.y) < tolerance) return 'n';
    if (Math.abs(pos.x - (area.x + area.width/2)) < tolerance && Math.abs(pos.y - (area.y + area.height)) < tolerance) return 's';
    if (Math.abs(pos.x - area.x) < tolerance && Math.abs(pos.y - (area.y + area.height/2)) < tolerance) return 'w';
    if (Math.abs(pos.x - (area.x + area.width)) < tolerance && Math.abs(pos.y - (area.y + area.height/2)) < tolerance) return 'e';
    
    return null;
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    const area = printAreas[selectedGarment]?.[selectedSide];
    if (!area) return;
    const handle = getResizeHandle(pos);

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart(pos);
    } else if (pos.x >= area.x && pos.x <= area.x + area.width &&
               pos.y >= area.y && pos.y <= area.y + area.height) {
      setIsDragging(true);
      setDragStart({ x: pos.x - area.x, y: pos.y - area.y });
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    const area = printAreas[selectedGarment]?.[selectedSide];
    if (!area) return;

    // Update cursor
    const canvas = canvasRef.current;
    const handle = getResizeHandle(pos);
    if (handle) {
      const cursors = {
        'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
        'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize'
      };
      canvas.style.cursor = cursors[handle];
    } else if (pos.x >= area.x && pos.x <= area.x + area.width &&
               pos.y >= area.y && pos.y <= area.y + area.height) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'default';
    }

    if (isDragging) {
      const newArea = {
        ...area,
        x: Math.max(0, Math.min(CANVAS_WIDTH - area.width, pos.x - dragStart.x)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT - area.height, pos.y - dragStart.y))
      };
      setPrintAreas(prev => ({ 
        ...prev, 
        [selectedGarment]: {
          ...prev[selectedGarment],
          [selectedSide]: newArea
        }
      }));
    } else if (isResizing && resizeHandle) {
      let newArea = { ...area };

      switch (resizeHandle) {
        case 'nw':
          newArea.width = area.width + (area.x - pos.x);
          newArea.height = area.height + (area.y - pos.y);
          newArea.x = pos.x;
          newArea.y = pos.y;
          break;
        case 'ne':
          newArea.width = pos.x - area.x;
          newArea.height = area.height + (area.y - pos.y);
          newArea.y = pos.y;
          break;
        case 'sw':
          newArea.width = area.width + (area.x - pos.x);
          newArea.height = pos.y - area.y;
          newArea.x = pos.x;
          break;
        case 'se':
          newArea.width = pos.x - area.x;
          newArea.height = pos.y - area.y;
          break;
        case 'n':
          newArea.height = area.height + (area.y - pos.y);
          newArea.y = pos.y;
          break;
        case 's':
          newArea.height = pos.y - area.y;
          break;
        case 'w':
          newArea.width = area.width + (area.x - pos.x);
          newArea.x = pos.x;
          break;
        case 'e':
          newArea.width = pos.x - area.x;
          break;
      }

      // Ensure minimum size
      newArea.width = Math.max(50, newArea.width);
      newArea.height = Math.max(50, newArea.height);

      // Apply aspect ratio lock if enabled
      if (aspectRatioLocked) {
        // Maintain 14:20 ratio (width:height = 0.7)
        if (resizeHandle === 'n' || resizeHandle === 's') {
          // Height changed, adjust width
          newArea.width = Math.round(newArea.height * DTG_ASPECT_RATIO);
        } else if (resizeHandle === 'w' || resizeHandle === 'e') {
          // Width changed, adjust height
          newArea.height = Math.round(newArea.width / DTG_ASPECT_RATIO);
        } else {
          // Corner resize - prioritize width
          newArea.height = Math.round(newArea.width / DTG_ASPECT_RATIO);
        }
      }

      setPrintAreas(prev => ({ 
        ...prev, 
        [selectedGarment]: {
          ...prev[selectedGarment],
          [selectedSide]: newArea
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const updateValue = (field, value) => {
    const numValue = parseInt(value) || 0;
    const currentArea = printAreas[selectedGarment]?.[selectedSide];
    if (!currentArea) return;
    
    let newArea = {
      ...currentArea,
      [field]: numValue
    };

    // Apply aspect ratio lock if enabled
    if (aspectRatioLocked) {
      if (field === 'width') {
        newArea.height = Math.round(numValue / DTG_ASPECT_RATIO);
      } else if (field === 'height') {
        newArea.width = Math.round(numValue * DTG_ASPECT_RATIO);
      }
    }

    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: {
        ...prev[selectedGarment],
        [selectedSide]: newArea
      }
    }));
  };

  const saveToDatabase = async () => {
    try {
      // Save to localStorage immediately for local persistence
      localStorage.setItem('savedPrintAreas', JSON.stringify(printAreas));
      
      // Save to database via API
      setSaveStatus('Saving...');
      const response = await api.post('/api/settings/print-areas', {
        printAreas: printAreas
      });
      
      if (response.data.success) {
        setSaveStatus('Saved to Database!');
        console.log('Print areas saved to database');
      } else {
        setSaveStatus('Saved Locally');
        console.log('Database save failed, saved locally');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      // Still saved to localStorage even if database fails
      setSaveStatus('Saved Locally');
    }
    
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const copyToClipboard = () => {
    const code = `const PRINT_AREAS = ${JSON.stringify(printAreas, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Print areas copied to clipboard!');
  };

  const resetCurrent = () => {
    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: {
        ...prev[selectedGarment],
        [selectedSide]: INITIAL_PRINT_AREAS[selectedGarment]?.[selectedSide]
      }
    }));
  };

  const resetAll = () => {
    setPrintAreas(INITIAL_PRINT_AREAS);
  };

  const applyDTGRatio = () => {
    const area = printAreas[selectedGarment]?.[selectedSide];
    if (!area) return;
    
    const newHeight = Math.round(area.width / DTG_ASPECT_RATIO);
    
    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: {
        ...prev[selectedGarment],
        [selectedSide]: {
          ...area,
          height: newHeight
        }
      }
    }));
  };

  const copyFromFront = () => {
    const frontArea = printAreas[selectedGarment]?.front;
    if (!frontArea) return;
    
    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: {
        ...prev[selectedGarment],
        back: { ...frontArea }
      }
    }));
    setSaveStatus('Copied front to back!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const currentArea = printAreas[selectedGarment]?.[selectedSide];
  const currentGarment = garmentTypes.find(g => g.id === selectedGarment);
  const hasBackSide = printAreas[selectedGarment]?.back !== null;

  return (
    <div className="bounding-box-editor">
      <h1>Garment Bounding Box Editor (Admin Only)</h1>
      <div className="admin-warning">
        ⚠️ <strong>Admin Tool:</strong> Changes here affect ALL products and ALL users globally. 
        The bounding boxes define the printable area for each garment type across the entire platform.
      </div>
      
      <div className="editor-container">
        <div className="canvas-section">
          <canvas
            ref={canvasRef}
            className="bounding-box-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ 
              display: 'block', 
              margin: '0 auto',
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
              });
              handleMouseDown(mouseEvent);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
              });
              handleMouseMove(mouseEvent);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMouseUp();
            }}
          />
          <div className="canvas-info">
            <p>Click and drag the blue box to reposition</p>
            <p>Drag the handles to resize</p>
            <p>Red crosshair shows center point</p>
          </div>
        </div>

        <div className="controls-section">
          <div className="garment-selector">
            <h3>Select Garment</h3>
            <select 
              value={selectedGarment || ''} 
              onChange={(e) => setSelectedGarment(e.target.value)}
              className="garment-select"
            >
              {garmentTypes.length === 0 && (
                <option value="">Loading templates...</option>
              )}
              {garmentTypes.map(garment => (
                <option key={garment.id} value={garment.id}>
                  {garment.name}
                </option>
              ))}
            </select>
          </div>

          <div className="side-selector">
            <h3>Select Side</h3>
            <div className="side-buttons">
              <button
                onClick={() => setSelectedSide('front')}
                className={`side-btn ${selectedSide === 'front' ? 'active' : ''}`}
              >
                Front
              </button>
              {hasBackSide && (
                <button
                  onClick={() => setSelectedSide('back')}
                  className={`side-btn ${selectedSide === 'back' ? 'active' : ''}`}
                >
                  Back
                </button>
              )}
              {selectedSide === 'back' && hasBackSide && (
                <button
                  onClick={copyFromFront}
                  className="btn-copy"
                  title="Copy front dimensions to back"
                >
                  Copy from Front
                </button>
              )}
            </div>
            {!hasBackSide && (
              <p className="no-back-note">This garment type has no back print area</p>
            )}
          </div>

          <div className="numeric-controls">
            <h3>Bounding Box Values ({selectedSide})</h3>
            {currentArea ? (
              <div className="control-grid">
                <div className="control-group">
                  <label>X Position:</label>
                  <input
                    type="number"
                    value={currentArea.x}
                    onChange={(e) => updateValue('x', e.target.value)}
                  />
                </div>
                <div className="control-group">
                  <label>Y Position:</label>
                  <input
                    type="number"
                    value={currentArea.y}
                    onChange={(e) => updateValue('y', e.target.value)}
                  />
                </div>
                <div className="control-group">
                  <label>Width:</label>
                  <input
                    type="number"
                    value={currentArea.width}
                    onChange={(e) => updateValue('width', e.target.value)}
                  />
                </div>
                <div className="control-group">
                  <label>Height:</label>
                  <input
                    type="number"
                    value={currentArea.height}
                    onChange={(e) => updateValue('height', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="no-area-note">No print area for {selectedSide} side</p>
            )}
          </div>

          {currentArea && (
            <div className="center-info">
              <h3>Center Point</h3>
              <p>X: {Math.round(currentArea.x + currentArea.width / 2)}</p>
              <p>Y: {Math.round(currentArea.y + currentArea.height / 2)}</p>
            </div>
          )}

          <div className="dtg-controls">
            <h3>DTG Printer Settings</h3>
            <p className="dtg-info">14" × 20" Platen (Ratio: {DTG_ASPECT_RATIO.toFixed(2)})</p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={aspectRatioLocked}
                onChange={(e) => setAspectRatioLocked(e.target.checked)}
              />
              Lock 14:20 Aspect Ratio
            </label>
            <button onClick={applyDTGRatio} className="btn-dtg">
              Apply 14:20 Ratio to Current
            </button>
          </div>

          <div className="action-buttons">
            <button onClick={saveToDatabase} className="btn-save">
              {saveStatus || 'Save Globally (All Users)'}
            </button>
            <button onClick={resetCurrent} className="btn-secondary">
              Reset Current
            </button>
            <button onClick={resetAll} className="btn-warning">
              Reset All to Defaults
            </button>
            <button onClick={copyToClipboard} className="btn-primary">
              Export to Code
            </button>
          </div>
        </div>
      </div>

      <div className="all-values">
        <h3>All Print Areas</h3>
        <pre>{JSON.stringify(printAreas, null, 2)}</pre>
      </div>
    </div>
  );
};

export default BoundingBoxEditor;