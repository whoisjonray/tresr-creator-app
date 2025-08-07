import React, { useState, useRef, useEffect } from 'react';
import { getGarmentImage } from '../config/garmentImagesCloudinary';
import './BoundingBoxEditor.css';

// Current print areas from DesignEditor.jsx
const INITIAL_PRINT_AREAS = {
  'tee': { width: 280, height: 350, x: 200, y: 200 },
  'boxy': { width: 300, height: 350, x: 200, y: 200 },
  'next-crop': { width: 250, height: 250, x: 200, y: 180 },
  'wmn-hoodie': { width: 280, height: 340, x: 200, y: 220 },
  'med-hood': { width: 280, height: 340, x: 200, y: 220 },
  'mediu': { width: 280, height: 340, x: 200, y: 200 },
  'polo': { width: 250, height: 320, x: 200, y: 200 },
  'patch-c': { width: 120, height: 80, x: 200, y: 150 },
  'patch-flat': { width: 120, height: 80, x: 200, y: 150 },
  'mug': { width: 200, height: 200, x: 200, y: 200 },
  'art-sqsm': { width: 400, height: 400, x: 200, y: 200 },
  'art-sqm': { width: 400, height: 400, x: 200, y: 200 },
  'art-lg': { width: 400, height: 400, x: 200, y: 200 },
  'nft': { width: 300, height: 400, x: 200, y: 200 }
};

const GARMENT_TYPES = [
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

const BoundingBoxEditor = () => {
  const [selectedGarment, setSelectedGarment] = useState('tee');
  const [printAreas, setPrintAreas] = useState(INITIAL_PRINT_AREAS);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [garmentImage, setGarmentImage] = useState(null);
  const canvasRef = useRef(null);

  // Canvas size
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    loadGarmentImage();
  }, [selectedGarment]);

  useEffect(() => {
    drawCanvas();
  }, [garmentImage, printAreas, selectedGarment]);

  const loadGarmentImage = async () => {
    const garment = GARMENT_TYPES.find(g => g.id === selectedGarment);
    if (!garment) return;

    try {
      // Map to Cloudinary garment type
      const garmentType = selectedGarment;
      const imageUrl = getGarmentImage(garmentType, 'white', 'front');
      
      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setGarmentImage(img);
        };
        img.src = imageUrl;
      }
    } catch (error) {
      console.error('Failed to load garment image:', error);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw garment image
    if (garmentImage) {
      ctx.drawImage(garmentImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Draw placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw bounding box
    const area = printAreas[selectedGarment];
    if (area) {
      // Draw semi-transparent fill
      ctx.fillStyle = 'rgba(0, 123, 255, 0.1)';
      ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw border
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);

      // Draw resize handles
      const handleSize = 8;
      ctx.fillStyle = '#007bff';
      
      // Corners
      ctx.fillRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
      
      // Edges
      ctx.fillRect(area.x + area.width/2 - handleSize/2, area.y - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width/2 - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x - handleSize/2, area.y + area.height/2 - handleSize/2, handleSize, handleSize);
      ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height/2 - handleSize/2, handleSize, handleSize);

      // Draw center crosshair
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 1;
      const centerX = area.x + area.width / 2;
      const centerY = area.y + area.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();

      // Draw dimensions
      ctx.fillStyle = '#333';
      ctx.font = '12px monospace';
      ctx.fillText(`${Math.round(area.width)} x ${Math.round(area.height)}`, area.x, area.y - 5);
      ctx.fillText(`(${Math.round(area.x)}, ${Math.round(area.y)})`, area.x, area.y + area.height + 15);
    }
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
    const area = printAreas[selectedGarment];
    const handleSize = 8;
    const tolerance = 5;

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
    const area = printAreas[selectedGarment];
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
    const area = printAreas[selectedGarment];

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
      setPrintAreas(prev => ({ ...prev, [selectedGarment]: newArea }));
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

      setPrintAreas(prev => ({ ...prev, [selectedGarment]: newArea }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const updateValue = (field, value) => {
    const numValue = parseInt(value) || 0;
    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: {
        ...prev[selectedGarment],
        [field]: numValue
      }
    }));
  };

  const copyToClipboard = () => {
    const code = `const PRINT_AREAS = ${JSON.stringify(printAreas, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Print areas copied to clipboard!');
  };

  const resetCurrent = () => {
    setPrintAreas(prev => ({
      ...prev,
      [selectedGarment]: INITIAL_PRINT_AREAS[selectedGarment]
    }));
  };

  const resetAll = () => {
    setPrintAreas(INITIAL_PRINT_AREAS);
  };

  const currentArea = printAreas[selectedGarment];
  const currentGarment = GARMENT_TYPES.find(g => g.id === selectedGarment);

  return (
    <div className="bounding-box-editor">
      <h1>Garment Bounding Box Editor</h1>
      
      <div className="editor-container">
        <div className="canvas-section">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
              value={selectedGarment} 
              onChange={(e) => setSelectedGarment(e.target.value)}
              className="garment-select"
            >
              {GARMENT_TYPES.map(garment => (
                <option key={garment.id} value={garment.id}>
                  {garment.name}
                </option>
              ))}
            </select>
          </div>

          <div className="numeric-controls">
            <h3>Bounding Box Values</h3>
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
          </div>

          <div className="center-info">
            <h3>Center Point</h3>
            <p>X: {Math.round(currentArea.x + currentArea.width / 2)}</p>
            <p>Y: {Math.round(currentArea.y + currentArea.height / 2)}</p>
          </div>

          <div className="action-buttons">
            <button onClick={resetCurrent} className="btn-secondary">
              Reset Current
            </button>
            <button onClick={resetAll} className="btn-warning">
              Reset All
            </button>
            <button onClick={copyToClipboard} className="btn-primary">
              Copy All to Clipboard
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