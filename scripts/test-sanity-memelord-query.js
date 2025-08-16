#!/usr/bin/env node

/**
 * Test Script: Query Sanity Production for Memelord's Products
 * 
 * This script directly queries Sanity production to fetch ONE specific product
 * from memelord (person ID: k2r2aa8vmghuyr3he0p2eo5e) with ALL its fields
 * to understand the complete data structure.
 * 
 * Usage: node test-sanity-memelord-query.js
 */

const { createClient } = require('@sanity/client');
require('dotenv').config();

// Sanity Configuration
const SANITY_CONFIG = {
  projectId: 'a9vtdosx',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN, // Set in .env file
  useCdn: false, // Use fresh data for testing
  apiVersion: '2024-01-01'
};

// Memelord's person ID
const MEMELORD_PERSON_ID = 'k2r2aa8vmghuyr3he0p2eo5e';

class SanityTester {
  constructor() {
    this.client = createClient(SANITY_CONFIG);
    console.log('🔧 Sanity Test Client initialized:');
    console.log(`   Project ID: ${SANITY_CONFIG.projectId}`);
    console.log(`   Dataset: ${SANITY_CONFIG.dataset}`);
    console.log(`   Token configured: ${!!SANITY_CONFIG.token}`);
    console.log(`   CDN disabled: ${!SANITY_CONFIG.useCdn}`);
    console.log('');
  }

  /**
   * Test 1: Verify person exists
   */
  async testPersonExists() {
    console.log('🔍 TEST 1: Checking if memelord person exists...');
    
    try {
      const query = `*[_id == "${MEMELORD_PERSON_ID}"][0] {
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
        updatedAt,
        _rev,
        _createdAt,
        _updatedAt
      }`;

      const person = await this.client.fetch(query);
      
      if (person) {
        console.log('✅ Person found!');
        console.log(JSON.stringify(person, null, 2));
        return person;
      } else {
        console.log('❌ Person not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching person:', error);
      return null;
    }
  }

  /**
   * Test 2: Count products for memelord
   */
  async testProductCount() {
    console.log('\n🔍 TEST 2: Counting products for memelord...');
    
    try {
      // Multiple query approaches to find products
      const queries = [
        // Direct reference in creators array
        `count(*[_type == "product" && "${MEMELORD_PERSON_ID}" in creators[]._ref])`,
        
        // References function
        `count(*[_type == "product" && references("${MEMELORD_PERSON_ID}")])`,
        
        // Creator field (legacy)
        `count(*[_type == "product" && creator._ref == "${MEMELORD_PERSON_ID}"])`,
        
        // Any reference combination
        `count(*[_type == "product" && (
          "${MEMELORD_PERSON_ID}" in creators[]._ref || 
          references("${MEMELORD_PERSON_ID}") ||
          creator._ref == "${MEMELORD_PERSON_ID}"
        )])`
      ];

      const results = [];
      for (let i = 0; i < queries.length; i++) {
        try {
          const count = await this.client.fetch(queries[i]);
          results.push({ method: i + 1, query: queries[i], count });
          console.log(`   Method ${i + 1}: ${count} products`);
        } catch (error) {
          console.log(`   Method ${i + 1}: Error - ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error counting products:', error);
      return [];
    }
  }

  /**
   * Test 3: Get ONE complete product with ALL fields
   */
  async testCompleteProduct() {
    console.log('\n🔍 TEST 3: Fetching ONE complete product with ALL fields...');
    
    try {
      const query = `*[_type == "product" && (
        "${MEMELORD_PERSON_ID}" in creators[]._ref || 
        references("${MEMELORD_PERSON_ID}") ||
        creator._ref == "${MEMELORD_PERSON_ID}"
      )][0] {
        // Core fields
        _id,
        _type,
        _rev,
        _createdAt,
        _updatedAt,
        
        // Product information
        title,
        "slug": slug.current,
        description,
        
        // Creator relationships
        creator,
        creators[]-> {
          _id,
          _type,
          name,
          username,
          email,
          walletAddress,
          wallets[]
        },
        
        // Images with full metadata
        "images": images[] {
          _key,
          _type,
          asset-> {
            _id,
            _type,
            url,
            originalFilename,
            size,
            mimeType,
            metadata {
              dimensions {
                width,
                height,
                aspectRatio
              },
              palette {
                dominant {
                  background,
                  foreground
                },
                darkMuted {
                  background,
                  foreground
                },
                lightVibrant {
                  background,
                  foreground
                }
              },
              hasAlpha,
              isOpaque
            }
          },
          alt,
          caption
        },
        
        // Design positioning
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
        
        // Product styles and variants
        productStyles[]-> {
          _id,
          _type,
          name,
          sku,
          garmentType,
          basePrice,
          colors[],
          sizes[],
          description,
          isActive
        },
        
        // Categories and tags
        category-> {
          _id,
          title,
          slug
        },
        tags[],
        
        // Status and visibility
        isActive,
        isFeatured,
        isPublic,
        publishedAt,
        
        // Analytics
        salesCount,
        viewCount,
        likeCount,
        
        // Timestamps
        createdAt,
        updatedAt,
        
        // Additional metadata that might exist
        price,
        currency,
        commission,
        royalty,
        nftData,
        blockchain,
        mintedAt,
        tokenId,
        contractAddress,
        
        // Any other fields
        ...
      }`;

      console.log('📝 Query being executed:');
      console.log(query);
      console.log('');

      const product = await this.client.fetch(query);
      
      if (product) {
        console.log('✅ Product found! Here\'s the complete data structure:');
        console.log('');
        console.log('='.repeat(80));
        console.log(JSON.stringify(product, null, 2));
        console.log('='.repeat(80));
        console.log('');
        
        // Analyze the structure
        this.analyzeProductStructure(product);
        
        return product;
      } else {
        console.log('❌ No products found for memelord');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching product:', error);
      return null;
    }
  }

  /**
   * Test 4: List all products (just IDs and titles)
   */
  async testListAllProducts() {
    console.log('\n🔍 TEST 4: Listing all products for memelord (IDs and titles only)...');
    
    try {
      const query = `*[_type == "product" && (
        "${MEMELORD_PERSON_ID}" in creators[]._ref || 
        references("${MEMELORD_PERSON_ID}") ||
        creator._ref == "${MEMELORD_PERSON_ID}"
      )] {
        _id,
        title,
        "slug": slug.current,
        isActive,
        publishedAt,
        createdAt,
        salesCount,
        viewCount
      } | order(createdAt desc)`;

      const products = await this.client.fetch(query);
      
      console.log(`✅ Found ${products.length} products:`);
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.title} (${product._id})`);
        console.log(`      Slug: ${product.slug || 'none'}`);
        console.log(`      Active: ${product.isActive}`);
        console.log(`      Sales: ${product.salesCount || 0}, Views: ${product.viewCount || 0}`);
        console.log('');
      });
      
      return products;
    } catch (error) {
      console.error('❌ Error listing products:', error);
      return [];
    }
  }

  /**
   * Test 5: Raw person document check
   */
  async testRawPersonCheck() {
    console.log('\n🔍 TEST 5: Raw person document check...');
    
    try {
      const query = `*[_id == "${MEMELORD_PERSON_ID}"][0]`;
      const person = await this.client.fetch(query);
      
      if (person) {
        console.log('✅ Raw person document:');
        console.log(JSON.stringify(person, null, 2));
        return person;
      } else {
        console.log('❌ Person not found in raw check');
        return null;
      }
    } catch (error) {
      console.error('❌ Error in raw person check:', error);
      return null;
    }
  }

  /**
   * Analyze product structure for insights
   */
  analyzeProductStructure(product) {
    console.log('📊 PRODUCT STRUCTURE ANALYSIS:');
    console.log('');
    
    // Top-level fields
    const topLevelFields = Object.keys(product);
    console.log(`🔢 Top-level fields (${topLevelFields.length}):`, topLevelFields.join(', '));
    console.log('');
    
    // Image analysis
    if (product.images) {
      console.log(`🖼️  Images: ${product.images.length} found`);
      product.images.forEach((img, i) => {
        console.log(`   Image ${i + 1}: ${img.asset?.url ? 'Has URL' : 'No URL'} | ${img.asset?.metadata?.dimensions ? `${img.asset.metadata.dimensions.width}x${img.asset.metadata.dimensions.height}` : 'No dimensions'}`);
      });
      console.log('');
    }
    
    // Creator information
    if (product.creators) {
      console.log(`👤 Creators: ${product.creators.length} found`);
      product.creators.forEach((creator, i) => {
        console.log(`   Creator ${i + 1}: ${creator.name || creator.username || creator._id}`);
      });
      console.log('');
    }
    
    // Product styles
    if (product.productStyles) {
      console.log(`👕 Product Styles: ${product.productStyles.length} found`);
      product.productStyles.forEach((style, i) => {
        console.log(`   Style ${i + 1}: ${style.name} (${style.garmentType}) - ${style.sku}`);
      });
      console.log('');
    }
    
    // Design positioning
    if (product.overlayTopLeft && product.overlayBottomRight) {
      console.log(`📐 Design Position: (${product.overlayTopLeft.x}, ${product.overlayTopLeft.y}) to (${product.overlayBottomRight.x}, ${product.overlayBottomRight.y})`);
      console.log('');
    }
    
    // Analytics
    console.log(`📈 Analytics: Sales: ${product.salesCount || 0}, Views: ${product.viewCount || 0}, Likes: ${product.likeCount || 0}`);
    console.log('');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Sanity Memelord Product Query Tests');
    console.log('='.repeat(60));
    console.log('');

    // Check authentication
    if (!SANITY_CONFIG.token) {
      console.error('❌ SANITY_API_TOKEN not found in environment variables');
      console.log('   Please set SANITY_API_TOKEN in your .env file');
      return;
    }

    const results = {};

    // Run tests sequentially
    results.person = await this.testPersonExists();
    results.productCounts = await this.testProductCount();
    results.completeProduct = await this.testCompleteProduct();
    results.allProducts = await this.testListAllProducts();
    results.rawPerson = await this.testRawPersonCheck();

    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Person exists: ${results.person ? '✅' : '❌'}`);
    console.log(`Product count methods tested: ${results.productCounts.length}`);
    console.log(`Complete product fetched: ${results.completeProduct ? '✅' : '❌'}`);
    console.log(`Total products listed: ${results.allProducts.length}`);
    console.log(`Raw person check: ${results.rawPerson ? '✅' : '❌'}`);
    
    if (results.completeProduct) {
      console.log('\n🎯 SUCCESS: Complete product data structure captured!');
      console.log('   You can use this structure to understand all available fields');
      console.log('   and build proper queries for your application.');
    } else {
      console.log('\n⚠️  WARNING: No complete product found');
      console.log('   Check if the person ID is correct or if there are products available');
    }

    return results;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new SanityTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n✅ All tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = SanityTester;