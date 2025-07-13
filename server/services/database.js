const { 
  sequelize, 
  Creator, 
  Design, 
  DesignProduct, 
  DesignVariant,
  DesignAnalytics 
} = require('../models');
const { v4: uuidv4 } = require('uuid');
const cloudinaryService = require('./cloudinary');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Skip database init if no database is configured
      if (!sequelize || (process.env.NODE_ENV === 'production' && !process.env.MYSQL_URL && !process.env.DATABASE_URL && !process.env.MYSQLHOST)) {
        console.log('⚠️ Database not configured, service will use localStorage fallback');
        return;
      }
      
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      this.isConnected = true;
      
      // Sync models in development (use migrations in production)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized.');
      }
    } catch (error) {
      console.error('⚠️ Unable to connect to the database:', error.message);
      this.isConnected = false;
    }
  }

  // Check if database is available
  isDatabaseAvailable() {
    return this.isConnected;
  }

  // Creator operations
  async findOrCreateCreator(userData) {
    try {
      const [creator, created] = await Creator.findOrCreate({
        where: { id: userData.userId || userData.id },
        defaults: {
          id: userData.userId || userData.id,
          email: userData.email,
          name: userData.name || userData.alias,
          walletAddress: userData.walletAddress
        }
      });

      if (!created && (creator.name !== userData.name || creator.walletAddress !== userData.walletAddress)) {
        await creator.update({
          name: userData.name || userData.alias,
          walletAddress: userData.walletAddress
        });
      }

      return creator;
    } catch (error) {
      console.error('Error finding/creating creator:', error);
      throw error;
    }
  }

  // Design operations
  async createDesign(creatorId, designData) {
    const transaction = await sequelize.transaction();
    
    try {
      const designId = uuidv4();
      
      // Create the design
      const design = await Design.create({
        id: designId,
        creatorId,
        name: designData.name || 'Untitled Design',
        description: designData.description,
        frontDesignUrl: designData.frontDesignUrl,
        frontDesignPublicId: designData.frontDesignPublicId,
        backDesignUrl: designData.backDesignUrl,
        backDesignPublicId: designData.backDesignPublicId,
        frontPosition: designData.frontPosition || { x: 200, y: 150 },
        backPosition: designData.backPosition || { x: 200, y: 150 },
        frontScale: designData.frontScale || 1.0,
        backScale: designData.backScale || 1.0,
        tags: designData.tags || [],
        printMethod: designData.printMethod || 'DTG',
        nfcExperience: designData.nfcExperience
      }, { transaction });

      await transaction.commit();
      return design;
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating design:', error);
      throw error;
    }
  }

  async updateDesign(designId, creatorId, updates) {
    try {
      const design = await Design.findOne({
        where: { id: designId, creatorId }
      });

      if (!design) {
        throw new Error('Design not found or unauthorized');
      }

      await design.update(updates);
      return design;
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }

  async getDesignById(designId, creatorId) {
    try {
      const design = await Design.findOne({
        where: { id: designId, creatorId },
        include: [
          {
            model: DesignProduct,
            as: 'products',
            include: [{
              model: DesignVariant,
              as: 'variants'
            }]
          }
        ]
      });

      return design;
    } catch (error) {
      console.error('Error fetching design:', error);
      throw error;
    }
  }

  async getCreatorDesigns(creatorId, options = {}) {
    const { page = 1, limit = 20, status = null } = options;
    const offset = (page - 1) * limit;

    try {
      const result = await Design.findPaginated(creatorId, {
        limit,
        offset,
        status
      });

      return {
        designs: result.designs,
        pagination: {
          total: result.total,
          page,
          limit,
          hasMore: result.hasMore
        }
      };
    } catch (error) {
      console.error('Error fetching creator designs:', error);
      throw error;
    }
  }

  // Product operations
  async saveDesignProducts(designId, products) {
    const transaction = await sequelize.transaction();
    
    try {
      // Delete existing products for this design
      await DesignProduct.destroy({
        where: { designId },
        transaction
      });

      // Create new products
      const productPromises = products.map(async (product) => {
        const designProduct = await DesignProduct.create({
          designId,
          productTemplateId: product.templateId,
          isEnabled: product.isEnabled,
          selectedColors: product.selectedColors || [],
          priceOverride: product.priceOverride,
          printLocation: product.printLocation || 'front'
        }, { transaction });

        // Create variants if provided
        if (product.variants && product.variants.length > 0) {
          const variantPromises = product.variants.map(variant => 
            DesignVariant.create({
              designProductId: designProduct.id,
              color: variant.color,
              side: variant.side || 'front',
              mockupUrl: variant.mockupUrl,
              mockupPublicId: variant.mockupPublicId,
              mockupWidth: variant.width || 2000,
              mockupHeight: variant.height || 2000,
              fileSizeKb: variant.fileSizeKb
            }, { transaction })
          );
          
          await Promise.all(variantPromises);
        }

        return designProduct;
      });

      const savedProducts = await Promise.all(productPromises);
      await transaction.commit();
      
      return savedProducts;
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving design products:', error);
      throw error;
    }
  }

  async saveGeneratedVariants(designProductId, variants) {
    const transaction = await sequelize.transaction();
    
    try {
      // Delete existing variants
      await DesignVariant.destroy({
        where: { designProductId },
        transaction
      });

      // Create new variants
      const variantPromises = variants.map(variant => 
        DesignVariant.create({
          designProductId,
          color: variant.color,
          side: variant.side || 'front',
          mockupUrl: variant.url,
          mockupPublicId: variant.publicId,
          mockupWidth: variant.width || 2000,
          mockupHeight: variant.height || 2000,
          fileSizeKb: variant.imageSizeKB
        }, { transaction })
      );

      const savedVariants = await Promise.all(variantPromises);
      await transaction.commit();
      
      return savedVariants;
    } catch (error) {
      await transaction.rollback();
      console.error('Error saving variants:', error);
      throw error;
    }
  }

  // Analytics operations
  async trackDesignEvent(designId, eventType, eventData = {}) {
    try {
      await DesignAnalytics.create({
        designId,
        eventType,
        eventData
      });
    } catch (error) {
      console.error('Error tracking design event:', error);
      // Don't throw - analytics shouldn't break the app
    }
  }

  // Memory management operations
  async cleanupOldDrafts(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Find old drafts
      const oldDrafts = await Design.findAll({
        where: {
          status: 'draft',
          updatedAt: { $lt: cutoffDate }
        },
        include: [{
          model: DesignProduct,
          as: 'products',
          include: [{
            model: DesignVariant,
            as: 'variants'
          }]
        }]
      });

      // Delete associated Cloudinary images
      for (const draft of oldDrafts) {
        // Delete design images
        if (draft.frontDesignPublicId) {
          await cloudinaryService.deleteImage(draft.frontDesignPublicId);
        }
        if (draft.backDesignPublicId) {
          await cloudinaryService.deleteImage(draft.backDesignPublicId);
        }

        // Delete variant mockups
        for (const product of draft.products) {
          for (const variant of product.variants) {
            if (variant.mockupPublicId) {
              await cloudinaryService.deleteImage(variant.mockupPublicId);
            }
          }
        }
      }

      // Delete the drafts (cascades to products and variants)
      const deletedCount = await Design.destroy({
        where: {
          status: 'draft',
          updatedAt: { $lt: cutoffDate }
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old drafts`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      throw error;
    }
  }

  // Migration helper - convert localStorage data to database
  async migrateFromLocalStorage(localStorageData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { designs = [], creator } = localStorageData;
      
      // Ensure creator exists
      if (creator) {
        await this.findOrCreateCreator(creator);
      }

      // Migrate each design
      for (const oldDesign of designs) {
        // Create design
        const design = await Design.create({
          id: oldDesign.id || uuidv4(),
          creatorId: creator.id,
          name: oldDesign.name,
          description: oldDesign.description,
          status: oldDesign.isPublished ? 'published' : 'draft',
          frontDesignUrl: oldDesign.designImage,
          backDesignUrl: oldDesign.backDesignImage,
          frontPosition: oldDesign.position,
          backPosition: oldDesign.backPosition,
          frontScale: oldDesign.scale,
          backScale: oldDesign.backScale,
          publishedAt: oldDesign.publishedAt
        }, { transaction });

        // Migrate products and variants
        if (oldDesign.products) {
          for (const oldProduct of oldDesign.products) {
            const designProduct = await DesignProduct.create({
              designId: design.id,
              productTemplateId: oldProduct.id,
              isEnabled: oldProduct.enabled,
              selectedColors: oldProduct.selectedColors,
              shopifyProductId: oldProduct.shopifyProductId
            }, { transaction });

            // Migrate variants
            if (oldProduct.mockups) {
              for (const mockup of oldProduct.mockups) {
                await DesignVariant.create({
                  designProductId: designProduct.id,
                  color: mockup.color,
                  mockupUrl: mockup.url,
                  mockupPublicId: mockup.publicId
                }, { transaction });
              }
            }
          }
        }
      }

      await transaction.commit();
      console.log(`✅ Migrated ${designs.length} designs from localStorage`);
    } catch (error) {
      await transaction.rollback();
      console.error('Error migrating from localStorage:', error);
      throw error;
    }
  }

  // Connection pool management
  async closeConnections() {
    try {
      await sequelize.close();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();