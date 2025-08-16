/**
 * Clear All Memelord Designs Script
 * 
 * This script removes all existing designs for the memelord creator (ID: 31162d55-0da5-4b13-ad7c-3cafd170cebf)
 * to prepare for a fresh import. It handles:
 * - Deleting design variants and their Cloudinary images
 * - Deleting design products 
 * - Deleting designs and their Cloudinary images
 * - Cleaning up analytics data
 * 
 * Usage: node scripts/clear-memelord-designs.js [--dry-run] [--force]
 */

const path = require('path');
const { 
  sequelize, 
  Creator, 
  Design, 
  DesignProduct, 
  DesignVariant, 
  DesignAnalytics 
} = require('../server/models');

const cloudinaryService = require('../server/services/cloudinary');

// Memelord creator ID
const MEMELORD_CREATOR_ID = '31162d55-0da5-4b13-ad7c-3cafd170cebf';

class MemelordDesignCleaner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.deletedImages = [];
    this.errors = [];
    this.stats = {
      designs: 0,
      products: 0,
      variants: 0,
      analytics: 0,
      images: 0
    };
  }

  async run() {
    try {
      console.log('🧹 Memelord Design Cleaner Starting...');
      console.log(`Creator ID: ${MEMELORD_CREATOR_ID}`);
      console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
      console.log('─'.repeat(50));

      // Check database connection
      if (!sequelize) {
        throw new Error('Database not available');
      }

      await sequelize.authenticate();
      console.log('✅ Database connection established');

      // Verify creator exists
      await this.verifyCreator();

      // Get all designs for memelord
      const designs = await this.getMemelordDesigns();
      
      if (designs.length === 0) {
        console.log('ℹ️ No designs found for memelord creator');
        return;
      }

      console.log(`📋 Found ${designs.length} designs to process`);

      // Process each design
      for (const design of designs) {
        await this.processDesign(design);
      }

      // Final cleanup and summary
      await this.showSummary();

    } catch (error) {
      console.error('❌ Script failed:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }

  async verifyCreator() {
    const creator = await Creator.findByPk(MEMELORD_CREATOR_ID);
    
    if (!creator) {
      throw new Error(`Creator with ID ${MEMELORD_CREATOR_ID} not found`);
    }

    console.log(`✅ Creator found: ${creator.name || creator.email} (${creator.id})`);
    return creator;
  }

  async getMemelordDesigns() {
    return await Design.findAll({
      where: { 
        creatorId: MEMELORD_CREATOR_ID 
      },
      include: [
        {
          model: DesignProduct,
          as: 'products',
          include: [{
            model: DesignVariant,
            as: 'variants'
          }]
        },
        {
          model: DesignAnalytics,
          as: 'analytics'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async processDesign(design) {
    console.log(`\n📝 Processing design: "${design.name}" (${design.id})`);
    console.log(`   Status: ${design.status}, Created: ${design.createdAt?.toISOString()?.split('T')[0]}`);

    try {
      // Delete design variants and their images
      await this.deleteDesignVariants(design);

      // Delete design products
      await this.deleteDesignProducts(design);

      // Delete analytics
      await this.deleteDesignAnalytics(design);

      // Delete design images from Cloudinary
      await this.deleteDesignImages(design);

      // Delete the design itself
      await this.deleteDesign(design);

      this.stats.designs++;
      console.log(`   ✅ Design processed successfully`);

    } catch (error) {
      this.errors.push(`Design ${design.id}: ${error.message}`);
      console.error(`   ❌ Error processing design: ${error.message}`);
    }
  }

  async deleteDesignVariants(design) {
    const allVariants = design.products.reduce((variants, product) => {
      return variants.concat(product.variants || []);
    }, []);

    if (allVariants.length === 0) {
      return;
    }

    console.log(`   🖼️ Processing ${allVariants.length} variants...`);

    // Delete variant images from Cloudinary
    for (const variant of allVariants) {
      if (variant.mockupPublicId) {
        await this.deleteCloudinaryImage(variant.mockupPublicId, 'variant mockup');
      }
    }

    // Delete variants from database
    if (!this.dryRun) {
      for (const product of design.products) {
        if (product.variants && product.variants.length > 0) {
          await DesignVariant.destroy({
            where: { designProductId: product.id }
          });
          this.stats.variants += product.variants.length;
        }
      }
    } else {
      this.stats.variants += allVariants.length;
    }

    console.log(`   ✅ ${allVariants.length} variants processed`);
  }

  async deleteDesignProducts(design) {
    if (!design.products || design.products.length === 0) {
      return;
    }

    console.log(`   📦 Processing ${design.products.length} products...`);

    if (!this.dryRun) {
      await DesignProduct.destroy({
        where: { designId: design.id }
      });
    }

    this.stats.products += design.products.length;
    console.log(`   ✅ ${design.products.length} products processed`);
  }

  async deleteDesignAnalytics(design) {
    if (!design.analytics || design.analytics.length === 0) {
      return;
    }

    console.log(`   📊 Processing ${design.analytics.length} analytics records...`);

    if (!this.dryRun) {
      await DesignAnalytics.destroy({
        where: { designId: design.id }
      });
    }

    this.stats.analytics += design.analytics.length;
    console.log(`   ✅ ${design.analytics.length} analytics records processed`);
  }

  async deleteDesignImages(design) {
    const imagesToDelete = [
      { publicId: design.frontDesignPublicId, type: 'front design' },
      { publicId: design.backDesignPublicId, type: 'back design' }
    ].filter(img => img.publicId);

    for (const image of imagesToDelete) {
      await this.deleteCloudinaryImage(image.publicId, image.type);
    }
  }

  async deleteCloudinaryImage(publicId, type) {
    try {
      if (!this.dryRun && cloudinaryService && typeof cloudinaryService.deleteImage === 'function') {
        await cloudinaryService.deleteImage(publicId);
        console.log(`     🗑️ Deleted ${type} image: ${publicId}`);
      } else {
        console.log(`     🗑️ [DRY RUN] Would delete ${type} image: ${publicId}`);
      }
      
      this.deletedImages.push({ publicId, type });
      this.stats.images++;
    } catch (error) {
      console.warn(`     ⚠️ Failed to delete ${type} image ${publicId}: ${error.message}`);
      this.errors.push(`Image ${publicId}: ${error.message}`);
    }
  }

  async deleteDesign(design) {
    if (!this.dryRun) {
      await Design.destroy({
        where: { id: design.id }
      });
    }

    console.log(`   🗑️ Design deleted from database`);
  }

  async showSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`Mode: ${this.dryRun ? 'DRY RUN (no changes made)' : 'LIVE EXECUTION'}`);
    console.log(`Creator: ${MEMELORD_CREATOR_ID}`);
    console.log('');
    console.log('Items processed:');
    console.log(`  • Designs: ${this.stats.designs}`);
    console.log(`  • Products: ${this.stats.products}`);
    console.log(`  • Variants: ${this.stats.variants}`);
    console.log(`  • Analytics: ${this.stats.analytics}`);
    console.log(`  • Images: ${this.stats.images}`);
    console.log('');

    if (this.deletedImages.length > 0) {
      console.log('Cloudinary images processed:');
      const imagesByType = {};
      this.deletedImages.forEach(img => {
        imagesByType[img.type] = (imagesByType[img.type] || 0) + 1;
      });
      Object.entries(imagesByType).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count}`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('⚠️ Errors encountered:');
      this.errors.forEach(error => console.log(`  • ${error}`));
      console.log('');
    }

    const totalItems = this.stats.designs + this.stats.products + this.stats.variants + this.stats.analytics;
    
    if (this.dryRun) {
      console.log('✅ Dry run completed successfully');
      console.log(`📋 ${totalItems} items would be deleted`);
      console.log('💡 Run with --force to execute the cleanup');
    } else {
      console.log('✅ Cleanup completed successfully');
      console.log(`🗑️ ${totalItems} items deleted`);
      console.log('🎯 Ready for fresh import');
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--force');
  const force = args.includes('--force');

  if (!dryRun && !force) {
    console.log('⚠️ This script will permanently delete all memelord designs!');
    console.log('💡 Use --dry-run to preview changes, or --force to execute');
    process.exit(1);
  }

  const cleaner = new MemelordDesignCleaner({ 
    dryRun: dryRun && !force,
    force 
  });

  await cleaner.run();
  
  // Close database connection
  if (sequelize) {
    await sequelize.close();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { MemelordDesignCleaner, MEMELORD_CREATOR_ID };