import React, { useRef, useEffect } from 'react';
import './BoundingBoxEditor.css';

const BoundingBoxEditorSimple = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log('Simple BoundingBoxEditor mounted');
    
    // Draw something on the canvas to make sure it's visible
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 600, 600);
      
      // Draw border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 600, 600);
      
      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Canvas is Working!', 300, 300);
      
      console.log('Canvas drawn successfully');
    } else {
      console.error('Canvas ref not available');
    }
  }, []);

  return (
    <div className="bounding-box-editor">
      <h1>Simple Canvas Test</h1>
      
      <div style={{ padding: '20px' }}>
        <div style={{ 
          width: '600px', 
          height: '600px', 
          border: '2px solid blue',
          background: 'white',
          position: 'relative'
        }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
              display: 'block',
              width: '600px',
              height: '600px'
            }}
          />
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <p>If you can see this text but no canvas above, there's a rendering issue.</p>
          <p>The canvas should show a gray background with "Canvas is Working!" text.</p>
        </div>
      </div>
    </div>
  );
};

export default BoundingBoxEditorSimple;