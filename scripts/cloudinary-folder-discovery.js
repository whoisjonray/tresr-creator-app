require('dotenv').config({ path: '../.env' });
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY || '364274988183368',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'gJEAx4VjStv1uTKyi3DiLAwL8pQ'
});

async function discoverAllFolders() {
  console.log('🔍 Discovering ALL Cloudinary folders and their structure...\n');
  
  const allFolders = new Map();
  const folderStructure = {};
  
  try {
    // Get all root folders
    console.log('📁 Getting root folders...');
    const rootFolders = await cloudinary.api.root_folders();
    console.log(`Found ${rootFolders.folders.length} root folders:\n`);
    
    for (const folder of rootFolders.folders) {
      console.log(`\n📂 ${folder.name}/`);
      folderStructure[folder.name] = {
        path: folder.path,
        subfolders: [],
        imageCount: 0,
        sampleImages: []
      };
      
      // Get subfolders
      try {
        const subfolders = await cloudinary.api.sub_folders(folder.name);
        if (subfolders.folders && subfolders.folders.length > 0) {
          console.log(`  └─ Subfolders: ${subfolders.folders.map(f => f.name).join(', ')}`);
          folderStructure[folder.name].subfolders = subfolders.folders.map(f => ({
            name: f.name,
            path: f.path
          }));
        }
      } catch (e) {
        // No subfolders
      }
      
      // Get sample images from each folder
      try {
        const resources = await cloudinary.api.resources({
          type: 'upload',
          prefix: folder.name + '/',
          max_results: 5
        });
        
        if (resources.resources.length > 0) {
          console.log(`  └─ ${resources.resources.length} images found`);
          folderStructure[folder.name].imageCount = resources.total_count || resources.resources.length;
          folderStructure[folder.name].sampleImages = resources.resources.map(r => ({
            public_id: r.public_id,
            url: r.secure_url,
            format: r.format,
            created: r.created_at
          }));
          
          // Show first image as example
          console.log(`  └─ Sample: ${resources.resources[0].public_id}`);
        }
      } catch (e) {
        console.log(`  └─ Could not fetch images: ${e.message}`);
      }
    }
    
    // Special focus on the 20 garment-related folders based on old system analysis
    console.log('\n\n🎯 GARMENT FOLDERS (Based on img.ly system):');
    const garmentFolders = [
      'tee', 'boxy', 'next-crop', 'polo', 'mediu', 'med-hood', 
      'patch-c', 'patch-flat', 'wmn-hoodie', 'designs', 'products',
      'clipart', 'nfts', 'images', 'assets', 'templates', 'mockups',
      'overlays', 'backgrounds', 'textures'
    ];
    
    for (const folderName of garmentFolders) {
      if (folderStructure[folderName]) {
        console.log(`\n✅ ${folderName}/ - EXISTS`);
        console.log(`   Images: ${folderStructure[folderName].imageCount}`);
        if (folderStructure[folderName].subfolders.length > 0) {
          console.log(`   Parts: ${folderStructure[folderName].subfolders.map(s => s.name).join(', ')}`);
        }
      } else {
        console.log(`\n❌ ${folderName}/ - NOT FOUND (may be in subfolders)`);
      }
    }
    
    // Look for nested garment structures
    console.log('\n\n🔍 NESTED GARMENT STRUCTURES:');
    for (const [rootFolder, data] of Object.entries(folderStructure)) {
      for (const subfolder of data.subfolders) {
        if (garmentFolders.includes(subfolder.name)) {
          console.log(`Found ${subfolder.name} under ${rootFolder}/`);
        }
      }
    }
    
    // Analyze pattern for design-to-product mapping
    console.log('\n\n🔗 DESIGN TO PRODUCT MAPPING:');
    
    // Check designs folder structure
    if (folderStructure['designs']) {
      console.log('\n📐 Designs folder structure:');
      const designSample = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'designs/',
        max_results: 10
      });
      
      // Analyze path patterns
      const creatorIds = new Set();
      designSample.resources.forEach(r => {
        const parts = r.public_id.split('/');
        if (parts.length > 1) {
          creatorIds.add(parts[1]); // Second part is usually creator ID
        }
      });
      
      console.log(`  └─ Creator folders found: ${Array.from(creatorIds).slice(0, 5).join(', ')}...`);
      console.log(`  └─ Pattern: designs/{creatorId}/{designId}`);
    }
    
    // Check products folder structure
    if (folderStructure['products']) {
      console.log('\n🛍️ Products folder structure:');
      const productSample = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'products/',
        max_results: 10
      });
      
      // Analyze mockup patterns
      const mockupPatterns = new Set();
      productSample.resources.forEach(r => {
        const filename = r.public_id.split('/').pop();
        // Extract pattern (e.g., tee_front_white, boxy_back_black)
        const parts = filename.split('_');
        if (parts.length >= 2) {
          mockupPatterns.add(`${parts[0]}_${parts[1]}`);
        }
      });
      
      console.log(`  └─ Mockup patterns: ${Array.from(mockupPatterns).slice(0, 5).join(', ')}...`);
      console.log(`  └─ Pattern: products/{creatorId}/{garment}_{side}_{color}`);
    }
    
    // Save complete mapping
    const fs = require('fs');
    const mappingDoc = {
      discoveredAt: new Date().toISOString(),
      totalFolders: Object.keys(folderStructure).length,
      garmentFoldersFound: garmentFolders.filter(f => folderStructure[f]).length,
      folderStructure: folderStructure,
      patterns: {
        designs: 'designs/{creatorId}/{designId}.{format}',
        products: 'products/{creatorId}/{garment}_{side}_{color}.{format}',
        garments: '{garmentType}/{side}/{color}.png'
      },
      mappingStrategy: {
        step1: 'User uploads design -> Store in designs/{creatorId}/',
        step2: 'Generate mockups using garment templates',
        step3: 'Composite design onto garment at defined coordinates',
        step4: 'Save mockup to products/{creatorId}/',
        step5: 'Store metadata and URLs in Sanity'
      }
    };
    
    fs.writeFileSync(
      '../docs/cloudinary-complete-folder-mapping.json',
      JSON.stringify(mappingDoc, null, 2)
    );
    
    console.log('\n\n✅ Complete folder mapping saved to docs/cloudinary-complete-folder-mapping.json');
    
    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log(`Total folders discovered: ${Object.keys(folderStructure).length}`);
    console.log(`Garment folders found: ${garmentFolders.filter(f => folderStructure[f]).length}`);
    console.log(`Folders with images: ${Object.values(folderStructure).filter(f => f.imageCount > 0).length}`);
    
    return folderStructure;
    
  } catch (error) {
    console.error('❌ Error discovering folders:', error);
    return null;
  }
}

// Run discovery
discoverAllFolders()
  .then(() => {
    console.log('\n✅ Folder discovery complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });