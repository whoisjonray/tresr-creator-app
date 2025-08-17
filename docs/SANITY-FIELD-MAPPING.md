# Sanity to TRESR Field Mapping Documentation

## 🎯 CRITICAL DISCOVERY
After extensive swarm analysis, we discovered that Sanity products use completely different field structures than initially assumed. Images are NOT in an `images[]` array but in specific typed fields.

## Complete Sanity Product Schema

### Core Identity Fields
- **`_id`**: Sanity document ID (e.g., "asjpjqvsg84wtk59nl9ywlga")
- **`_type`**: Always "product"
- **`title`**: Product name (e.g., "JUST Grok IT - Banner Tee")
- **`slug.current`**: URL slug (e.g., "just-grok-it-banner-t")
- **`sku`**: Product SKU (e.g., "TEE-TEE-JUST_GROK_IT_BANNER_T")
- **`designId`**: Cloudinary design identifier (e.g., "v3f3qtskkwi3ieo5iyrfuhpo")

### Image Fields (CRITICAL)
- **`mainImage`**: Primary product image object
  ```javascript
  {
    _key: "v3f3qtskkwi3ieo5iyrfuhpo_Front_main",
    _type: "cloudinaryImage",
    format: "png",
    height: 2000,
    width: 2000,
    title: "v3f3qtskkwi3ieo5iyrfuhpo_Front_main",
    uri: "https://res.cloudinary.com/dqslerzk9/image/upload/v1740958396/products/k2r2aa8vmghuyr3he0p2eo5e/j4oapq7bcs2y75v9nrmn.png"
  }
  ```

- **`secondaryImages[]`**: Array of additional images
  ```javascript
  [{
    _key: "...",
    _type: "cloudinaryImage",
    format: "png",
    height: 2000,
    width: 2000,
    title: "v3f3qtskkwi3ieo5iyrfuhpo_Back_main",
    uri: "https://res.cloudinary.com/..."
  }]
  ```

- **`variants[]`**: Each variant has its own images array
- **`images[]`**: LEGACY field - usually empty, DO NOT USE

### Creator/Owner Fields
- **`owner._ref`**: Owner person ID reference
- **`creators[]`**: Array of creator references
  ```javascript
  [{
    _key: "k2r2aa8vmghuyr3he0p2eo5e",
    _ref: "k2r2aa8vmghuyr3he0p2eo5e",
    _type: "reference"
  }]
  ```

### Product Details
- **`description`**: Long description (often empty)
- **`details`**: Short description (e.g., "Grok banner tee.")
- **`regularPrice`**: Base price (e.g., 42)
- **`productStyle._ref`**: Style reference ID
- **`productStyles`**: Array of style references
- **`tags[]`**: Product tags (e.g., ["elon-musk"])
- **`visibility`**: "public" or "private"
- **`isActive`**: Boolean for active status

### Analytics Fields
- **`sales`**: Total sales count
- **`views`**: Recent view count
- **`allTimeViews`**: Total view count

### Position/Canvas Data (for design editor)
- **`overlayTopLeft`**: {x, y} coordinates
- **`overlayBottomRight`**: {x, y} coordinates
- **`printAreaTopLeft`**: {x, y} coordinates
- **`printAreaBottomRight`**: {x, y} coordinates

## Cloudinary URL Structure

### URL Pattern
`https://res.cloudinary.com/dqslerzk9/image/upload/v{version}/products/{creatorId}/{imageId}.{format}`

### Components
- **Cloud Name**: `dqslerzk9`
- **Creator Folder**: `products/{creatorId}` (e.g., `products/k2r2aa8vmghuyr3he0p2eo5e`)
- **Image ID**: Last part before extension (e.g., `j4oapq7bcs2y75v9nrmn`)

### Mockup Naming Convention
- **Front**: `{designId}_Front_main`
- **Back**: `{designId}_Back_main`
- **Raw Design**: Separate ID (e.g., `ef5r64t9ehz15kw5hds8vm2t`)

## TRESR Database Mapping

### designs Table
| TRESR Field | Sanity Field | Notes |
|------------|--------------|-------|
| sanity_id | _id | Unique Sanity document ID |
| name | title | Product name |
| description | description OR details | Use details if description empty |
| thumbnail_url | mainImage.uri | Primary image URL |
| front_design_url | mainImage.uri | Front mockup |
| back_design_url | secondaryImages[0].uri | Back mockup if available |
| tags | tags | JSON array |
| status | isActive ? 'published' : 'draft' | |
| creator_id | Dynamic.xyz ID | From session |

### design_data JSON Field
```javascript
{
  designId: sanityDesign.designId,
  mainImage: sanityDesign.mainImage,
  secondaryImages: sanityDesign.secondaryImages,
  productStyle: sanityDesign.productStyle,
  sales: sanityDesign.sales,
  views: sanityDesign.allTimeViews,
  visibility: sanityDesign.visibility,
  regularPrice: sanityDesign.regularPrice,
  elements: [{
    type: 'image',
    src: mainImage.uri,
    position: {x, y, width, height},
    side: 'front'
  }]
}
```

## Import Process Flow

1. **Query Sanity** with creator's person ID
2. **Extract Images** from `mainImage` and `secondaryImages` (NOT `images[]`)
3. **Store Cloudinary URLs** directly - they're already in the `uri` field
4. **Convert Positions** from bounding box to center-based coordinates
5. **Save design_data** with full metadata for design editor

## Common Mistakes to Avoid

❌ **DON'T** use the `images[]` field - it's usually empty
❌ **DON'T** expect asset references - URLs are stored directly in `uri`
❌ **DON'T** ignore `mainImage` and `secondaryImages` - these have the actual images

✅ **DO** use `mainImage.uri` for thumbnail
✅ **DO** check `secondaryImages` for additional views
✅ **DO** store the `designId` for future Cloudinary operations
✅ **DO** preserve all metadata in `design_data` JSON field

## Example Query (CORRECT)
```javascript
const query = `*[_type == "product" && creator._ref == "${personId}"] {
  _id,
  title,
  mainImage {
    uri,
    title,
    _key
  },
  secondaryImages[] {
    uri,
    title,
    _key
  },
  designId,
  // ... other fields
}`;
```

## Verification Steps

1. Check that `mainImage.uri` exists and is a valid Cloudinary URL
2. Verify `designId` matches the pattern in mockup titles
3. Ensure creator references match the expected person ID
4. Validate that position data can be converted to canvas coordinates