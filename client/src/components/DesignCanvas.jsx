import React, { useRef, useEffect, useState } from 'react';

function DesignCanvas({ 
  product, 
  designImage, 
  designPosition, 
  onPositionChange,
  isActive 
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || !product || !designImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw product mockup background
    if (product.mockupImage) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = product.color || '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Draw product outline
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(
        product.printArea.x,
        product.printArea.y,
        product.printArea.width,
        product.printArea.height
      );
    }
    
    // Draw design
    if (designImage && designPosition) {
      ctx.save();
      
      // Calculate position
      const x = product.printArea.x + (designPosition.x * product.printArea.width);
      const y = product.printArea.y + (designPosition.y * product.printArea.height);
      const width = designPosition.scale * product.printArea.width * 0.8;
      const height = (designImage.height / designImage.width) * width;
      
      // Center the design
      ctx.drawImage(
        designImage,
        x - width / 2,
        y - height / 2,
        width,
        height
      );
      
      // Draw handles if active
      if (isActive) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          x - width / 2,
          y - height / 2,
          width,
          height
        );
      }
      
      ctx.restore();
    }
  }, [product, designImage, designPosition, isActive]);

  const handleMouseDown = (e) => {
    if (!isActive) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within print area
    if (
      x >= product.printArea.x &&
      x <= product.printArea.x + product.printArea.width &&
      y >= product.printArea.y &&
      y <= product.printArea.y + product.printArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isActive) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = (x - dragStart.x) / product.printArea.width;
    const deltaY = (y - dragStart.y) / product.printArea.height;
    
    const newPosition = {
      x: Math.max(0, Math.min(1, designPosition.x + deltaX)),
      y: Math.max(0, Math.min(1, designPosition.y + deltaY)),
      scale: designPosition.scale
    };
    
    onPositionChange(newPosition);
    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!isActive) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.max(0.1, Math.min(2, designPosition.scale + delta));
    
    onPositionChange({
      ...designPosition,
      scale: newScale
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={600}
      className={`design-canvas ${isActive ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        cursor: isDragging ? 'grabbing' : (isActive ? 'grab' : 'default'),
        border: isActive ? '2px solid #007bff' : '1px solid #ddd',
        borderRadius: '8px',
        background: 'white'
      }}
    />
  );
}

export default DesignCanvas;