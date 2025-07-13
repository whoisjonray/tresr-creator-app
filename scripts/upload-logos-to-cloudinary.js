const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dqslerzk9',
  api_key: process.env.CLOUDINARY_API_KEY || '364274988183368',
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Logo directory path
const LOGO_BASE_PATH = '/Users/user/Documents/TRESR Shopify/TRESR Public Logos';

// Logo structure mapping
const logoStructure = {
  'diamond': {
    path: 'Diamond Only',
    files: [
      { name: 'Diamond Black TRESR.png', id: 'diamond-black' },
      { name: 'Diamond Black TRESR.svg', id: 'diamond-black' },
      { name: 'Diamond Gold TRESR.png', id: 'diamond-gold' },
      { name: 'Diamond Gold TRESR.svg', id: 'diamond-gold' },
      { name: 'Diamond White TRESR.png', id: 'diamond-white' },
      { name: 'Diamond White TRESR.svg', id: 'diamond-white' }
    ]
  },
  'horizontal': {
    path: 'TRESR Logo Horizontal',
    files: [
      { name: 'TRESR Horizontal Black.png', id: 'horizontal-black' },
      { name: 'TRESR Logo Horizontal Black.svg', id: 'horizontal-black' },
      { name: 'Tresr Horizontal White.png', id: 'horizontal-white' },
      { name: 'TRESR Logo Horizontal White.svg', id: 'horizontal-white' },
      { name: 'Tresr Horizontal White Gold.png', id: 'horizontal-white-gold' },
      { name: 'TRESR Logo Horizontal Gold White.svg', id: 'horizontal-gold-white' }
    ]
  },
  'vertical': {
    path: 'TRESR Logo Vertical',
    files: [
      { name: 'TRESR Logo Vertical Black.png', id: 'vertical-black' },
      { name: 'TRESR Logo Vertical Black.svg', id: 'vertical-black' },
      { name: 'TRESR Logo Vertical White.png', id: 'vertical-white' },
      { name: 'TRESR Logo Vertical White.svg', id: 'vertical-white' },
      { name: 'TRESR Logo Vertical Gold White.png', id: 'vertical-gold-white' }
    ]
  },
  'patch': {
    path: 'TRESR Patch',
    files: [
      { name: 'PNG/TRESR Patch Black.png', id: 'patch-black' },
      { name: 'PNG/TRESR Patch Colour.png', id: 'patch-color' },
      { name: 'PNG/TRESR Patch White.png', id: 'patch-white' },
      { name: 'SVG/TRESR Logo Black.svg', id: 'patch-black' },
      { name: 'SVG/TRESR Logo 2025 Colour.svg', id: 'patch-2025-color' },
      { name: 'SVG/TRESR Logo 2025 White.svg', id: 'patch-2025-white' }
    ]
  },
  'text': {
    path: 'TRESR Text Only',
    files: [
      { name: 'TRESR Text Black.png', id: 'text-black' },
      { name: 'TRESR Text Black.svg', id: 'text-black' },
      { name: 'TRESR Text White.png', id: 'text-white' },
      { name: 'TRESR Text White.svg', id: 'text-white' }
    ]
  }
};

// Upload results storage
const uploadResults = [];

async function uploadLogo(filePath, publicId, folder) {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    const resourceType = fileExtension === '.svg' ? 'raw' : 'image';
    
    console.log(`📤 Uploading: ${path.basename(filePath)} as ${publicId}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: `tresr-logos/${folder}`,
      resource_type: resourceType,
      overwrite: true,
      tags: ['tresr', 'logo', folder],
      context: {
        alt: `TRESR ${folder} logo`,
        caption: `TRESR ${publicId.replace(/-/g, ' ')}`
      }
    });
    
    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    return {
      success: false,
      file: filePath,
      error: error.message
    };
  }
}

async function uploadAllLogos() {
  console.log('🎨 Starting TRESR logo upload to Cloudinary...\n');
  
  for (const [category, config] of Object.entries(logoStructure)) {
    console.log(`\n📁 Processing ${category} logos...`);
    
    for (const file of config.files) {
      const filePath = path.join(LOGO_BASE_PATH, config.path, file.name);
      const extension = path.extname(file.name).toLowerCase();
      const publicId = `${file.id}${extension}`;
      
      try {
        // Check if file exists
        await fs.access(filePath);
        
        const result = await uploadLogo(filePath, publicId, category);
        uploadResults.push({
          category,
          file: file.name,
          ...result
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`⚠️ File not found: ${filePath}`);
        uploadResults.push({
          category,
          file: file.name,
          success: false,
          error: 'File not found'
        });
      }
    }
  }
  
  // Generate documentation
  await generateDocumentation();
}

async function generateDocumentation() {
  console.log('\n📝 Generating documentation...');
  
  const successfulUploads = uploadResults.filter(r => r.success);
  const failedUploads = uploadResults.filter(r => !r.success);
  
  let documentation = `# TRESR Logo Assets on Cloudinary

Generated: ${new Date().toISOString()}
Total Uploads: ${uploadResults.length}
Successful: ${successfulUploads.length}
Failed: ${failedUploads.length}

## Cloudinary Folder Structure

All logos are stored under: \`tresr-logos/\`

### Categories:
- \`tresr-logos/diamond/\` - Diamond icon only
- \`tresr-logos/horizontal/\` - Horizontal layout logos
- \`tresr-logos/vertical/\` - Vertical layout logos
- \`tresr-logos/patch/\` - Patch/badge style logos
- \`tresr-logos/text/\` - Text only logos

## Logo URLs by Category

`;

  // Group by category
  const categories = {};
  successfulUploads.forEach(upload => {
    if (!categories[upload.category]) {
      categories[upload.category] = [];
    }
    categories[upload.category].push(upload);
  });

  // Document each category
  for (const [category, uploads] of Object.entries(categories)) {
    documentation += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)} Logos\n\n`;
    
    uploads.forEach(upload => {
      documentation += `#### ${upload.file}\n`;
      documentation += `- **URL**: ${upload.url}\n`;
      documentation += `- **Public ID**: \`${upload.publicId}\`\n`;
      documentation += `- **Format**: ${upload.format || upload.resourceType}\n`;
      if (upload.width) {
        documentation += `- **Dimensions**: ${upload.width}x${upload.height}px\n`;
      }
      documentation += `- **Size**: ${(upload.bytes / 1024).toFixed(1)}KB\n\n`;
    });
  }

  // Usage examples
  documentation += `\n## Usage Examples

### React Component
\`\`\`jsx
// Diamond icon
<img src="${successfulUploads.find(u => u.publicId.includes('diamond-black'))?.url}" alt="TRESR Logo" />

// Horizontal logo
<img src="${successfulUploads.find(u => u.publicId.includes('horizontal-black'))?.url}" alt="TRESR Logo" />

// Dynamic color based on theme
const logoUrl = isDarkMode 
  ? "${successfulUploads.find(u => u.publicId.includes('horizontal-white'))?.url}"
  : "${successfulUploads.find(u => u.publicId.includes('horizontal-black'))?.url}";
\`\`\`

### Shopify Liquid
\`\`\`liquid
<!-- Header logo -->
<img src="${successfulUploads.find(u => u.publicId.includes('horizontal-black'))?.url}" 
     alt="{{ shop.name }}" 
     width="200" />

<!-- Mobile logo (diamond only) -->
<img src="${successfulUploads.find(u => u.publicId.includes('diamond-gold'))?.url}" 
     alt="{{ shop.name }}" 
     width="40" />
\`\`\`

### CSS Background
\`\`\`css
.logo {
  background-image: url('${successfulUploads.find(u => u.publicId.includes('horizontal-black'))?.url}');
}

.logo-dark {
  background-image: url('${successfulUploads.find(u => u.publicId.includes('horizontal-white'))?.url}');
}
\`\`\`

## Cloudinary Transformations

You can apply transformations to any logo URL:

### Resize
\`${successfulUploads[0]?.url.replace('/upload/', '/upload/w_200/')}\`

### Format conversion
\`${successfulUploads[0]?.url.replace('/upload/', '/upload/f_auto/')}\`

### Quality optimization
\`${successfulUploads[0]?.url.replace('/upload/', '/upload/q_auto/')}\`

### Combined transformations
\`${successfulUploads[0]?.url.replace('/upload/', '/upload/w_200,f_auto,q_auto/')}\`
`;

  if (failedUploads.length > 0) {
    documentation += `\n## Failed Uploads\n\n`;
    failedUploads.forEach(upload => {
      documentation += `- ${upload.file}: ${upload.error}\n`;
    });
  }

  // Save documentation
  const docPath = path.join(__dirname, '../docs/tresr-logos-cloudinary.md');
  await fs.writeFile(docPath, documentation);
  console.log(`\n✅ Documentation saved to: ${docPath}`);
  
  // Also save JSON data for programmatic use
  const jsonData = {
    generated: new Date().toISOString(),
    baseFolder: 'tresr-logos',
    logos: categories,
    failed: failedUploads
  };
  
  const jsonPath = path.join(__dirname, '../docs/tresr-logos-cloudinary.json');
  await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`✅ JSON data saved to: ${jsonPath}`);
}

// Run the upload
uploadAllLogos().catch(console.error);