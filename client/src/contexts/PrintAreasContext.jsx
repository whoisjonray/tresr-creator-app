import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const PrintAreasContext = createContext();

// Default fallback if absolutely needed (minimal)
const EMERGENCY_DEFAULT = {
  width: 250,
  height: 300,
  x: 175,
  y: 150
};

export const PrintAreasProvider = ({ children }) => {
  const [printAreas, setPrintAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrintAreas();
  }, []);

  const loadPrintAreas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/settings/print-areas');
      console.log('PrintAreasContext: Loaded print areas from database:', response.data);
      
      if (response.data.success && response.data.printAreas) {
        setPrintAreas(response.data.printAreas);
      } else {
        // If no print areas in database, initialize with emergency defaults
        console.warn('No print areas in database, using emergency defaults');
        setPrintAreas({
          'tee': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'boxy': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'next-crop': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'baby-tee': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'wmn-hoodie': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'med-hood': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'mediu': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'sweat': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT },
          'patch-c': { front: { width: 120, height: 80, x: 240, y: 260 }, back: null },
          'patch-flat': { front: { width: 140, height: 80, x: 230, y: 260 }, back: null },
          'polo': { front: { width: 200, height: 250, x: 200, y: 100 }, back: { width: 200, height: 250, x: 200, y: 100 } }
        });
      }
    } catch (err) {
      console.error('Failed to load print areas:', err);
      setError(err.message);
      // Use emergency defaults on error
      setPrintAreas({
        'default': { front: EMERGENCY_DEFAULT, back: EMERGENCY_DEFAULT }
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrintArea = (productId, side = 'front') => {
    if (!printAreas) {
      console.warn('Print areas not loaded yet');
      return EMERGENCY_DEFAULT;
    }

    const productArea = printAreas[productId];
    if (productArea && productArea[side]) {
      return productArea[side];
    }

    // Fallback to default if product not found
    console.warn(`No print area found for ${productId} ${side}, using default`);
    return printAreas['default']?.[side] || EMERGENCY_DEFAULT;
  };

  const updatePrintArea = async (productId, side, newArea) => {
    // Update local state immediately for responsiveness
    setPrintAreas(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [side]: newArea
      }
    }));

    // Save to database
    try {
      await api.post('/api/settings/print-areas', {
        printAreas: {
          ...printAreas,
          [productId]: {
            ...printAreas[productId],
            [side]: newArea
          }
        }
      });
    } catch (err) {
      console.error('Failed to save print area:', err);
      // Reload to ensure consistency
      loadPrintAreas();
    }
  };

  const value = {
    printAreas,
    loading,
    error,
    getPrintArea,
    updatePrintArea,
    reloadPrintAreas: loadPrintAreas
  };

  return (
    <PrintAreasContext.Provider value={value}>
      {children}
    </PrintAreasContext.Provider>
  );
};

export const usePrintAreas = () => {
  const context = useContext(PrintAreasContext);
  if (!context) {
    throw new Error('usePrintAreas must be used within PrintAreasProvider');
  }
  return context;
};