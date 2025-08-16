const { createClient } = require('@sanity/client');
const cloudinary = require('./cloudinary');

/**
 * Sanity Data Migration Service
 * Handles importing designs and creator data from Sanity to the new system
 */
class SanityMigrationService {
  constructor() {
    this.client = createClient({
      projectId: process.env.SANITY_PROJECT_ID || 'a9vtdosx',
      dataset: process.env.SANITY_DATASET || 'production',
      token: process.env.SANITY_API_TOKEN,
      useCdn: true,
      apiVersion: '2024-01-01'
    });

    // Log configuration (without exposing token)
    console.log('📦 Sanity Migration Service initialized:');
    console.log('  Project ID:', process.env.SANITY_PROJECT_ID || 'a9vtdosx');
    console.log('  Dataset:', process.env.SANITY_DATASET || 'production');
    console.log('  Token configured:', !!process.env.SANITY_API_TOKEN);
  }

  /**
   * Fetch a person/creator from Sanity by ID
   * @param {string} personId - Sanity person ID
   */
  async fetchPerson(personId) {
    try {
      const query = `*[_id == "${personId}"][0] {
        _id,
        _type,
        name,
        email,
        username,
        walletAddress,
        wallets[],
        bio,
        isVerified,
        avatar {
          asset-> {
            _id,
            url
          }
        },
        socialLinks,
        createdAt,
        updatedAt
      }`;

      const person = await this.client.fetch(query);
      return person;
    } catch (error) {
      console.error('Failed to fetch person from Sanity:', error);
      throw error;
    }
  }

  /**
   * Fetch all designs for a specific creator
   * @param {string} personId - Sanity person ID
   */
  async fetchDesignsByCreator(personId) {
    try {
      const query = `*[_type == "product" && 
        (references("${personId}") || 
         "${personId}" in creators[]._ref)] {
        _id,
        title,
        "slug": slug.current,
        description,
        creator,
        creators[]-> {
          _id,
          name,
          username
        },
        "images": images[] {
          _key,
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          }
        },
        overlayTopLeft {
          x,
          y
        },
        overlayBottomRight {
          x,
          y
        },
        overlayPosition,
        printArea,
        productStyles[]-> {
          _id,
          name,
          sku,
          garmentType,
          basePrice
        },
        tags[],
        isActive,
        publishedAt,
        createdAt,
        updatedAt,
        salesCount,
        viewCount
      }`;

      const designs = await this.client.fetch(query);
      console.log(`Found ${designs.length} designs for person ${personId}`);
      return designs;
    } catch (error) {
      console.error('Failed to fetch designs from Sanity:', error);
      throw error;
    }
  }

  /**
   * Fetch all creators who have designs
   */
  async fetchAllCreators() {
    try {
      const query = `*[_type == "person" && count(*[_type == "product" && references(^._id)]) > 0] {
        _id,
        name,
        email,
        username,
        walletAddress,
        wallets[],
        "designCount": count(*[_type == "product" && references(^._id)])
      }`;

      const creators = await this.client.fetch(query);
      console.log(`Found ${creators.length} creators with designs`);
      return creators;
    } catch (error) {
      console.error('Failed to fetch creators from Sanity:', error);
      throw error;
    }
  }

  /**
   * Convert Sanity bounding box to center-based coordinates
   */
  convertBoundingBoxToCenter(topLeft, bottomRight) {
    if (!topLeft || !bottomRight) {
      // Default position if no bounding box
      return {
        x: 150,
        y: 150,
        width: 150,
        height: 150,
        scale: 1
      };
    }
    
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;
    const centerX = topLeft.x + (width / 2);
    const centerY = topLeft.y + (height / 2);
    
    return {
      x: centerX,
      y: centerY,
      width: width,
      height: height,
      scale: 1
    };
  }

  /**
   * Migrate design images to Cloudinary
   * @param {Object} sanityDesign - Design from Sanity
   */
  async migrateDesignImages(sanityDesign) {
    const migratedImages = {
      front: null,
      back: null,
      thumbnail: null,
      additional: []
    };

    try {
      // Process main image (front design)
      if (sanityDesign.images?.[0]?.asset?.url) {
        const frontUrl = sanityDesign.images[0].asset.url;
        
        // Upload to Cloudinary
        const cloudinaryResult = await cloudinary.uploadFromUrl(frontUrl, {
          folder: 'designs',
          public_id: `${sanityDesign._id}-front`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:best' }
          ]
        });

        migratedImages.front = cloudinaryResult.secure_url;
        
        // Create thumbnail
        const thumbnailUrl = cloudinary.getTransformedUrl(cloudinaryResult.public_id, {
          width: 400,
          height: 400,
          crop: 'fill'
        });
        migratedImages.thumbnail = thumbnailUrl;
      }

      // Process back image if exists
      if (sanityDesign.images?.[1]?.asset?.url) {
        const backUrl = sanityDesign.images[1].asset.url;
        
        const cloudinaryResult = await cloudinary.uploadFromUrl(backUrl, {
          folder: 'designs',
          public_id: `${sanityDesign._id}-back`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:best' }
          ]
        });

        migratedImages.back = cloudinaryResult.secure_url;
      }

      // Process additional images
      for (let i = 2; i < (sanityDesign.images?.length || 0); i++) {
        const imageUrl = sanityDesign.images[i].asset?.url;
        if (imageUrl) {
          const cloudinaryResult = await cloudinary.uploadFromUrl(imageUrl, {
            folder: 'designs',
            public_id: `${sanityDesign._id}-${i}`,
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          });
          migratedImages.additional.push(cloudinaryResult.secure_url);
        }
      }

      return migratedImages;
    } catch (error) {
      console.error('Failed to migrate images for design:', sanityDesign.title, error);
      // Return original URLs as fallback
      return {
        front: sanityDesign.images?.[0]?.asset?.url || '',
        back: sanityDesign.images?.[1]?.asset?.url || '',
        thumbnail: sanityDesign.images?.[0]?.asset?.url || '',
        additional: []
      };
    }
  }

  /**
   * Transform Sanity design to our database format
   * @param {Object} sanityDesign - Design from Sanity
   * @param {string} creatorId - Dynamic.xyz user ID
   */
  async transformDesign(sanityDesign, creatorId) {
    // Convert bounding box coordinates
    const frontPosition = this.convertBoundingBoxToCenter(
      sanityDesign.overlayTopLeft,
      sanityDesign.overlayBottomRight
    );

    // Migrate images to Cloudinary
    const migratedImages = await this.migrateDesignImages(sanityDesign);

    // Build transformed design object
    const transformedDesign = {
      sanityId: sanityDesign._id,
      creatorId: creatorId,
      name: sanityDesign.title,
      description: sanityDesign.description || '',
      thumbnailUrl: migratedImages.thumbnail,
      frontDesignUrl: migratedImages.front,
      backDesignUrl: migratedImages.back || migratedImages.front, // Use front as fallback
      additionalImages: migratedImages.additional,
      designData: {
        sanitySlug: sanityDesign.slug,
        tags: sanityDesign.tags || [],
        productStyles: sanityDesign.productStyles || [],
        originalCreators: sanityDesign.creators || [],
        salesCount: sanityDesign.salesCount || 0,
        viewCount: sanityDesign.viewCount || 0
      },
      frontPosition: frontPosition,
      backPosition: frontPosition, // Same as front by default
      frontScale: 1,
      backScale: 1,
      status: sanityDesign.isActive ? 'published' : 'draft',
      publishedAt: sanityDesign.publishedAt,
      createdAt: sanityDesign.createdAt || new Date().toISOString(),
      updatedAt: sanityDesign.updatedAt || new Date().toISOString()
    };

    return transformedDesign;
  }

  /**
   * Batch import designs for a creator
   * @param {string} sanityPersonId - Sanity person ID
   * @param {string} dynamicId - Dynamic.xyz user ID
   * @param {Object} Design - Design model
   */
  async batchImportDesigns(sanityPersonId, dynamicId, Design) {
    try {
      // Fetch all designs from Sanity
      const sanityDesigns = await this.fetchDesignsByCreator(sanityPersonId);
      
      const results = {
        imported: [],
        updated: [],
        errors: []
      };

      // Process designs in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < sanityDesigns.length; i += batchSize) {
        const batch = sanityDesigns.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (sanityDesign) => {
          try {
            // Check if design already exists
            let existingDesign = await Design.findOne({
              where: { 
                sanityId: sanityDesign._id,
                creatorId: dynamicId
              }
            });

            // Transform the design
            const transformedDesign = await this.transformDesign(sanityDesign, dynamicId);

            if (existingDesign) {
              // Update existing design
              await existingDesign.update(transformedDesign);
              results.updated.push({
                id: existingDesign.id,
                name: transformedDesign.name,
                sanityId: transformedDesign.sanityId
              });
              console.log(`✅ Updated design: ${transformedDesign.name}`);
            } else {
              // Create new design
              const newDesign = await Design.create(transformedDesign);
              results.imported.push({
                id: newDesign.id,
                name: transformedDesign.name,
                sanityId: transformedDesign.sanityId
              });
              console.log(`✅ Imported design: ${transformedDesign.name}`);
            }
          } catch (error) {
            console.error(`❌ Error processing design ${sanityDesign.title}:`, error);
            results.errors.push({
              design: sanityDesign.title,
              sanityId: sanityDesign._id,
              error: error.message
            });
          }
        }));
      }

      console.log(`📊 Import complete:
        - Imported: ${results.imported.length}
        - Updated: ${results.updated.length}
        - Errors: ${results.errors.length}
        - Total: ${sanityDesigns.length}`);

      return results;
    } catch (error) {
      console.error('Batch import failed:', error);
      throw error;
    }
  }

  /**
   * Find potential creator matches by email or wallet
   * @param {string} email - Email to search
   * @param {string} walletAddress - Wallet address to search
   */
  async findCreatorMatches(email, walletAddress) {
    try {
      const queries = [];
      
      if (email) {
        queries.push(`*[_type == "person" && email == "${email}"]`);
      }
      
      if (walletAddress) {
        queries.push(`*[_type == "person" && (walletAddress == "${walletAddress}" || "${walletAddress}" in wallets[])]`);
      }

      const results = await Promise.all(
        queries.map(q => this.client.fetch(q))
      );

      // Flatten and deduplicate results
      const allMatches = results.flat();
      const uniqueMatches = Array.from(
        new Map(allMatches.map(m => [m._id, m])).values()
      );

      return uniqueMatches;
    } catch (error) {
      console.error('Failed to find creator matches:', error);
      return [];
    }
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats() {
    try {
      const stats = await this.client.fetch(`{
        "totalCreators": count(*[_type == "person"]),
        "creatorsWithDesigns": count(*[_type == "person" && count(*[_type == "product" && references(^._id)]) > 0]),
        "totalDesigns": count(*[_type == "product"]),
        "activeDesigns": count(*[_type == "product" && isActive == true]),
        "totalProductStyles": count(*[_type == "productStyle"])
      }`);

      return stats;
    } catch (error) {
      console.error('Failed to get migration stats:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new SanityMigrationService();