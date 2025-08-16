# Sanity Memelord Product Query Test

This script tests direct queries to Sanity production to fetch memelord's products and understand the complete data structure.

## Setup

1. **Set your Sanity API token** in `.env` file:
   ```bash
   SANITY_API_TOKEN=your_sanity_token_here
   ```

2. **Install dependencies** (if not already done):
   ```bash
   cd server && npm install
   ```

## Usage

```bash
# From the server directory
cd server
node ../scripts/test-sanity-memelord-query.js

# Or from the scripts directory
cd scripts
node test-sanity-memelord-query.js

# Or make it executable and run directly
./test-sanity-memelord-query.js
```

## What This Script Does

### Test 1: Person Verification
- Checks if memelord's person document exists in Sanity
- Fetches all person-related fields

### Test 2: Product Count
- Tests multiple query approaches to count products
- Uses different methods to find product references

### Test 3: Complete Product Fetch ⭐
- **Main test**: Fetches ONE complete product with ALL fields
- Captures the entire data structure for analysis
- Shows exactly what fields are available

### Test 4: Product List
- Lists all products for memelord (IDs and titles only)
- Provides overview of available products

### Test 5: Raw Document Check
- Fetches the raw person document without field filtering
- Useful for debugging

## Expected Output

The script will show:

1. ✅ **Person verification** - confirms memelord exists
2. 📊 **Product counts** - how many products found with different methods
3. 🎯 **Complete product structure** - full JSON of one product
4. 📋 **Product list** - all available products
5. 📈 **Structure analysis** - breakdown of fields and data

## Key Information Captured

- **Complete field structure** of Sanity product documents
- **Image metadata** and URLs
- **Creator relationships** and references
- **Product styles** and variants
- **Design positioning** data (overlays, print areas)
- **Analytics data** (sales, views, etc.)
- **All available fields** in the actual data

## Configuration

- **Project ID**: `a9vtdosx`
- **Dataset**: `production`
- **Person ID**: `k2r2aa8vmghuyr3he0p2eo5e` (memelord)
- **CDN**: Disabled for fresh data

## Troubleshooting

- **"Person not found"**: Check if the person ID is correct
- **"No products found"**: May need to check different reference methods
- **Authentication error**: Verify SANITY_API_TOKEN is set correctly
- **Network issues**: Check internet connection and Sanity service status

## Using the Results

The complete product structure from Test 3 shows you:

1. **All available fields** in Sanity products
2. **Nested object structures** (images, creators, styles)
3. **Field types and formats** for proper querying
4. **Reference relationships** between documents

Use this structure to build proper queries for:
- Import scripts
- Data migration
- API endpoints
- Frontend components

## Next Steps

After running this test:

1. **Save the output** to understand the data structure
2. **Update import queries** based on actual field availability
3. **Map fields** to your application's data model
4. **Test with other creators** using different person IDs