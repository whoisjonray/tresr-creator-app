import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import designService from '../services/designService';
import canvasImageGenerator from '../services/canvasImageGenerator';

export const useDesignDatabase = (designId = null) => {
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load design if ID is provided
  useEffect(() => {
    if (designId) {
      loadDesign();
    }
  }, [designId]);

  const loadDesign = async () => {
    try {
      setLoading(true);
      const designData = await designService.getDesignById(designId);
      setDesign(designData);
      return designData;
    } catch (err) {
      setError('Failed to load design');
      console.error('Error loading design:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveDesign = useCallback(async (designData) => {
    try {
      setSaving(true);
      let savedDesign;

      if (design?.id || designId) {
        // Update existing design
        savedDesign = await designService.updateDesign(design?.id || designId, designData);
      } else {
        // Create new design
        savedDesign = await designService.createDesign(designData);
      }

      setDesign(savedDesign);
      return savedDesign;
    } catch (err) {
      setError('Failed to save design');
      console.error('Error saving design:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [design, designId]);

  const saveProducts = useCallback(async (products) => {
    if (!design?.id && !designId) {
      throw new Error('No design ID available');
    }

    try {
      setSaving(true);
      const savedProducts = await designService.saveDesignProducts(
        design?.id || designId,
        products
      );
      return savedProducts;
    } catch (err) {
      setError('Failed to save products');
      console.error('Error saving products:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [design, designId]);

  const saveVariants = useCallback(async (productId, variants) => {
    if (!design?.id && !designId) {
      throw new Error('No design ID available');
    }

    try {
      setSaving(true);
      
      // Upload variants to Cloudinary and get URLs
      const variantsWithUrls = await Promise.all(
        variants.map(async (variant) => {
          if (variant.url && variant.url.startsWith('data:')) {
            // This is a base64 image that needs to be uploaded
            const uploadedVariant = await uploadToCloudinary(variant);
            return uploadedVariant;
          }
          return variant;
        })
      );

      const savedVariants = await designService.saveDesignVariants(
        design?.id || designId,
        productId,
        variantsWithUrls
      );
      
      return savedVariants;
    } catch (err) {
      setError('Failed to save variants');
      console.error('Error saving variants:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [design, designId]);

  const publishDesign = useCallback(async () => {
    if (!design?.id && !designId) {
      throw new Error('No design ID available');
    }

    try {
      setSaving(true);
      const publishedDesign = await designService.publishDesign(design?.id || designId);
      setDesign(publishedDesign);
      return publishedDesign;
    } catch (err) {
      setError('Failed to publish design');
      console.error('Error publishing design:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [design, designId]);

  const deleteDesign = useCallback(async () => {
    if (!design?.id && !designId) {
      throw new Error('No design ID available');
    }

    try {
      setSaving(true);
      await designService.deleteDesign(design?.id || designId);
      
      // Clear image cache
      canvasImageGenerator.clearCache();
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete design');
      console.error('Error deleting design:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [design, designId, navigate]);

  // Helper to upload base64 image to Cloudinary via backend
  const uploadToCloudinary = async (variant) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/mockups/upload-product-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productName: variant.templateId || 'product',
          variants: [{
            color: variant.color,
            image: variant.url,
            side: variant.side || 'front'
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload to Cloudinary');
      }

      const result = await response.json();
      if (result.success && result.variants.length > 0) {
        return {
          ...variant,
          url: result.variants[0].url,
          publicId: result.variants[0].publicId
        };
      }

      throw new Error('No URL returned from upload');
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Return original variant if upload fails
      return variant;
    }
  };

  // Check if we need to migrate from localStorage
  const checkAndMigrate = useCallback(async () => {
    if (designService.needsMigration()) {
      try {
        console.log('📦 Migrating designs from localStorage to database...');
        const result = await designService.migrateFromLocalStorage();
        console.log(`✅ Migration complete: ${result.migrated || 0} designs migrated`);
      } catch (err) {
        console.error('Migration failed:', err);
      }
    }
  }, []);

  // Clear memory after operations
  const clearMemory = useCallback(() => {
    canvasImageGenerator.clearCache();
    
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }
  }, []);

  return {
    design,
    loading,
    error,
    saving,
    saveDesign,
    saveProducts,
    saveVariants,
    publishDesign,
    deleteDesign,
    checkAndMigrate,
    clearMemory
  };
};