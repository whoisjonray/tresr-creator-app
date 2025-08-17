# Complete Image Handling System Analysis: NFTreasure to TRESR Migration

## Executive Summary

The old NFTreasure system used a sophisticated image handling architecture combining:
- **img.ly Creative Engine** for design editing and mockup generation
- **Cloudinary** for image storage with 20+ specialized folders
- **Sanity CMS** for product schema and metadata management
- **Custom backend services** for image processing and product variant generation

## 1. img.ly Creative Engine Integration

### Core Implementation
The img.ly Creative Engine was integrated through the `CreatorClient` component in `/nftreasure-repos/store/apps/new-storefront/app/creator/Creator.client.tsx`:

```typescript
<EngineProvider
  config={{
    role: 'Creator',
    featureFlags: {
      preventScrolling: true,
      singlePageMode: true,
    },
    license: licenseKey,
    baseURL: '/imgly-assets',
    core: {
      baseURL: '/imgly-assets/core',
    },
  }}
  configure={async (engine, addSearchOptions) => {
    // Asset sources setup
    const shapesAsset = await createShapesSource(engine)
    const clipartAsset = await createClipArtSource(engine, backendApi)
    const imagesAsset = await createImagesSource(engine, backendApi)
    const nftAssets = await createNftSource(engine, backendApi)
    
    // Add all sources to engine
    engine.asset.addSource(shapesAsset.source)
    engine.asset.addSource(clipartAsset.source)
    engine.asset.addSource(imagesAsset.source)
    engine.asset.addSource(nftAssets.source)
  }}
>
```

### Key Features
- **WASM-based engine** with Core module at `/imgly-assets/core/cesdk-v1.47.0-*.wasm`
- **Asset management** with multiple sources (shapes, clipart, images, NFTs)
- **Real-time editing** with background layer support
- **Design export** to multiple formats and variants
- **Cloudinary integration** for asset search and storage

## 2. Cloudinary Folder Structure (20+ Folders)

Based on the analysis, the Cloudinary system was organized into these key folder categories:

### A. Garment-Specific Folders
```
tresr-garments/
├── tee/                    # Medium Weight T-Shirt
├── boxy/                   # Oversized Drop Shoulder
├── next-crop/              # Next Level Crop Top
├── polo/                   # Standard Polo
├── mediu/                  # Medium Weight Sweatshirt
├── med-hood/               # Medium Weight Hoodie
├── patch-c/                # Patch Hat - Curved
├── patch-flat/             # Patch Hat - Flat
├── wmn-hoodie/             # Women's Hoodie
├── art-sqsm/               # Art Print Square Small
├── art-sqm/                # Art Print Square Medium
├── art-lg/                 # Art Print Large
├── snaphat/                # Snapback Hat
├── stckr/                  # Stickers
├── std/                    # Standard items
├── gen/                    # Generic items
├── nft/                    # NFT collectibles
├── sweat/                  # Sweatshirts
├── hat/                    # Basic Hats
├── stdmug/                 # Standard Mugs
└── ...                     # Additional product types
```

### B. Sub-folder Structure by Garment Part
Each garment folder contains:
```
garment-type/
├── front/
│   ├── main.png            # Base template
│   ├── black.png           # Color variants
│   ├── white.png
│   ├── navy.png
│   ├── heather-grey.png
│   └── ...                 # Other colors
├── back/
│   ├── main.png
│   ├── black.png
│   └── ...                 # Color variants
├── left/                   # Left side (if applicable)
├── right/                  # Right side (if applicable)
├── sleeve/                 # Sleeve area (if applicable)
└── details/                # Additional detail views
```

### C. Asset Type Organization
```
cloudinary-root/
├── images/                 # General image assets
│   └── NFTREASURE/        # Brand-specific images
├── designs/                # User-created designs
├── products/               # Generated product mockups
├── clipart/                # Vector graphics
└── nfts/                   # NFT-related assets
```

## 3. Sanity Schema Relationships

### Product Schema Structure
The Sanity schemas defined the relationship between products and their image parts:

```typescript
// Product Style Schema
{
  parts: [
    {
      title: string,           // "Front", "Back", "Left Sleeve", etc.
      format: {
        width: number,
        height: number
      },
      overlayTopLeft: {        // Design placement coordinates
        x: number,
        y: number
      },
      overlayTopRight: {
        x: number,
        y: number
      },
      mainImage: CloudinaryImage,
      imageForColor: [
        {
          colorId: string,
          image: CloudinaryImage
        }
      ]
    }
  ]
}
```

### Variant Schema
```typescript
{
  title: string,
  sku: string,
  images: CloudinaryImage[],  // Generated mockup images
  color: Reference<Color>,
  size: Reference<Size>,
  price: number
}
```

## 4. Image Processing Workflow

### Design Creation Process
1. **User creates design** in img.ly Creative Engine
2. **Design exported** to multiple parts (Front, Back, etc.)
3. **Design uploaded** to Cloudinary `/designs/` folder
4. **Design metadata** stored in Sanity with `designId`

### Product Mockup Generation
The `variantImageLogic` function in `product.service.ts` handled mockup generation:

```typescript
private async variantImageLogic(
  design: SavedDesign,
  productStyleId: string,
  variants?: string[]
) {
  // 1. Fetch product style images from Sanity
  const images = await this.sanityService.fetchImagesForProductStyle(productStyleId);
  
  // 2. Map design labels to product parts
  const designs = design.labels.map((label, idx) => ({
    label,
    design: design.imageIds[idx],
    part: images.parts.find((p) => p.title === label)!,
  }));
  
  // 3. Generate mockups for each variant/color
  const backgrounds = variants.map((variant) => {
    const foundVariant = design.part!.imageForColor?.find((i) => i.colorId === variant)?.image ?? design.part!.mainImage;
    
    return {
      placement: {
        x: design.part!.overlayTopLeft.x!,
        y: design.part!.overlayTopLeft.y!,
        width: editWidth,
        height: editHeight,
      },
      variant: variant,
      url: foundVariant.url,
    };
  });
  
  // 4. Generate final product images
  const generated = await this.designService.generateStandardProductImages({
    designUrl: design.design,
    label: design.label,
    backgrounds,
  });
  
  return generated;
}
```

## 5. Asset Management System

### Cloudinary Asset Sources
The `createCloudinaryAssetSource` function provided search and retrieval:

```typescript
export const createCloudinaryAssetSource = (
  id: string,
  engine: CreativeEngine,
  backendApi: string,
  convertToLocalAssets: (results: NFTreasureImage[]) => Promise<CompleteAssetResult[]>
): AssetSource => {
  return {
    id,
    async findAssets(queryData) {
      // Search by tags, source, query, etc.
      const { data } = await axios.get<NFTreasureImageSearchResult>(
        `${backendApi}/images`,
        {
          params: {
            assetType: id,
            tags: queryData.tags,
            source,
            query: queryData.query,
            limit: queryData.perPage,
          }
        }
      );
      
      return await convertToLocalAssets(data.results);
    }
  }
}
```

### Image Upload and Processing
Images were processed through the `ImageService`:

```typescript
await this.imageService.uploadImage({
  assetType: 'products',        // or 'images', 'designs', 'clipart'
  source: product.owner?._ref,  // User/brand identifier
  isPublic: false,
  uploaderId: product.owner?._ref,
  image: Buffer,
  label: `${product._id}_${color.id}`,
  filename: `${product._id}_${color.id}.png`,
  tags: ['variant'],
  extraContext: {
    productId: product._id,
    colorId: color.id,
  },
});
```

## 6. Key Integration Points

### Design to Product Mapping
- **Design IDs** linked products to their source designs
- **Part labels** (Front, Back, etc.) matched Sanity schema parts
- **Color variants** generated separate mockups per color
- **Placement coordinates** defined where designs appeared on garments

### Performance Optimizations
- **Thumbnail generation** with Cloudinary transformations (`c_scale,h_125,w_125/`)
- **CDN caching** for frequently accessed images
- **Lazy loading** in the img.ly asset browser
- **Background processing** for mockup generation

## 7. Migration Implications for TRESR

### What to Preserve
1. **Cloudinary folder structure** - Already partially implemented
2. **Multi-part product support** - Front/Back/Sleeve placement system
3. **Color variant generation** - Automatic mockup creation per color
4. **Design-to-product linking** - designId reference system

### What to Modernize
1. **Replace img.ly** with TeeInBlue or custom editor
2. **Simplify asset management** - Direct Cloudinary integration
3. **Streamline schemas** - Remove legacy NFTreasure references
4. **Update file paths** - Use new TRESR folder structure

### Current Status in TRESR
- ✅ Basic Cloudinary integration established
- ✅ Garment mockup files uploaded to `tresr-garments/` folders
- ⚠️ Need to implement multi-part design placement
- ⚠️ Need to create color variant generation system
- ⚠️ Need to establish design-to-product workflow

## 8. Recommended Next Steps

1. **Implement Multi-Part System**: Create schema for Front/Back/Sleeve placement
2. **Build Color Variant Generator**: Automate mockup creation for each color
3. **Establish Design Upload Flow**: Connect TeeInBlue designs to Shopify products
4. **Create Asset Management**: Search and organize uploaded designs
5. **Implement Placement Coordinates**: Define design areas for each garment type

This analysis provides the foundation for implementing a modern, efficient image handling system in TRESR while preserving the sophisticated multi-part, multi-color capabilities of the original NFTreasure platform.