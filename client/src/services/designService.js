import api from './api';

// Design service for database operations
class DesignService {
  // Get all designs for the current creator (with pagination)
  async getMyDesigns(page = 1, limit = 20, status = null) {
    try {
      const params = { page, limit };
      if (status) params.status = status;
      
      const response = await api.get('/designs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching designs:', error);
      throw error;
    }
  }

  // Get a specific design by ID
  async getDesignById(designId) {
    try {
      const response = await api.get(`/designs/${designId}`);
      return response.data.design;
    } catch (error) {
      console.error('Error fetching design:', error);
      throw error;
    }
  }

  // Create a new design
  async createDesign(designData) {
    try {
      const response = await api.post('/designs', designData);
      return response.data.design;
    } catch (error) {
      console.error('Error creating design:', error);
      throw error;
    }
  }

  // Update an existing design
  async updateDesign(designId, updates) {
    try {
      const response = await api.put(`/designs/${designId}`, updates);
      return response.data.design;
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }

  // Save design products and configuration
  async saveDesignProducts(designId, products) {
    try {
      const response = await api.post(`/designs/${designId}/products`, { products });
      return response.data.products;
    } catch (error) {
      console.error('Error saving design products:', error);
      throw error;
    }
  }

  // Save generated variants after mockup generation
  async saveDesignVariants(designId, productId, variants) {
    try {
      const response = await api.post(`/designs/${designId}/products/${productId}/variants`, { variants });
      return response.data.variants;
    } catch (error) {
      console.error('Error saving variants:', error);
      throw error;
    }
  }

  // Publish a design
  async publishDesign(designId) {
    try {
      const response = await api.post(`/designs/${designId}/publish`);
      return response.data.design;
    } catch (error) {
      console.error('Error publishing design:', error);
      throw error;
    }
  }

  // Delete a design
  async deleteDesign(designId) {
    try {
      const response = await api.delete(`/designs/${designId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }

  // Migrate designs from localStorage to database (one-time operation)
  async migrateFromLocalStorage() {
    try {
      const localStorageData = {
        designs: this.getLocalStorageDesigns(),
        products: this.getLocalStorageProducts()
      };

      if (localStorageData.designs.length === 0) {
        console.log('No designs to migrate');
        return { success: true, migrated: 0 };
      }

      const response = await api.post('/designs/migrate', { localStorageData });
      
      // Clear localStorage after successful migration
      if (response.data.success) {
        localStorage.removeItem('designs');
        localStorage.removeItem('products');
        localStorage.removeItem('designDrafts');
      }

      return response.data;
    } catch (error) {
      console.error('Error migrating designs:', error);
      throw error;
    }
  }

  // Helper methods for localStorage migration
  getLocalStorageDesigns() {
    try {
      const designs = localStorage.getItem('designs');
      return designs ? JSON.parse(designs) : [];
    } catch (error) {
      console.error('Error parsing localStorage designs:', error);
      return [];
    }
  }

  getLocalStorageProducts() {
    try {
      const products = localStorage.getItem('products');
      return products ? JSON.parse(products) : [];
    } catch (error) {
      console.error('Error parsing localStorage products:', error);
      return [];
    }
  }

  // Check if migration is needed
  needsMigration() {
    const hasLocalDesigns = localStorage.getItem('designs') !== null;
    const hasLocalProducts = localStorage.getItem('products') !== null;
    const hasLocalDrafts = localStorage.getItem('designDrafts') !== null;
    
    return hasLocalDesigns || hasLocalProducts || hasLocalDrafts;
  }

  // Clear all cached data (for memory management)
  clearCache() {
    // This could interface with the canvas image generator
    if (window.canvasImageGenerator) {
      window.canvasImageGenerator.clearCache();
    }
  }
}

// Export singleton instance
export default new DesignService();