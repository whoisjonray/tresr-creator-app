import { useEffect, useRef, useState } from 'react';
import { getGarmentImage } from '../config/garmentImagesCloudinary';

// Cache for preloaded images
const imageCache = new Map();

export function useImagePreloader(activeProduct, availableColors = []) {
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);
  const loadedImages = useRef(new Set());

  useEffect(() => {
    if (!activeProduct || !availableColors.length) return;

    const preloadImages = async () => {
      setIsPreloading(true);
      const totalImages = availableColors.length * 2; // front and back
      let loadedCount = 0;

      const loadPromises = [];

      for (const color of availableColors) {
        // Preload front image
        const frontUrl = getGarmentImage(activeProduct, color, 'front');
        if (frontUrl && !imageCache.has(frontUrl)) {
          const frontPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageCache.set(frontUrl, img);
              loadedImages.current.add(frontUrl);
              loadedCount++;
              setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to preload: ${frontUrl}`);
              loadedCount++;
              setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
              resolve();
            };
            img.src = frontUrl;
          });
          loadPromises.push(frontPromise);
        } else {
          loadedCount++;
        }

        // Preload back image
        const backUrl = getGarmentImage(activeProduct, color, 'back');
        if (backUrl && !imageCache.has(backUrl)) {
          const backPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageCache.set(backUrl, img);
              loadedImages.current.add(backUrl);
              loadedCount++;
              setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to preload: ${backUrl}`);
              loadedCount++;
              setPreloadProgress(Math.round((loadedCount / totalImages) * 100));
              resolve();
            };
            img.src = backUrl;
          });
          loadPromises.push(backPromise);
        } else {
          loadedCount++;
        }
      }

      // Wait for all images to load
      await Promise.all(loadPromises);
      setIsPreloading(false);
      setPreloadProgress(100);
    };

    preloadImages();
  }, [activeProduct, availableColors]);

  // Function to get cached image or load it
  const getCachedImage = (url) => {
    if (imageCache.has(url)) {
      return imageCache.get(url);
    }
    // If not cached, create new image
    const img = new Image();
    img.src = url;
    return img;
  };

  return {
    isPreloading,
    preloadProgress,
    getCachedImage,
    imageCache
  };
}