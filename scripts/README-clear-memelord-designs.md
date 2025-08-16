# Clear Memelord Designs Script

## Overview

This script clears all existing designs for the memelord creator (ID: `31162d55-0da5-4b13-ad7c-3cafd170cebf`) to prepare for a fresh import. It safely handles cascading deletions and Cloudinary image cleanup.

## Usage

### Preview Changes (Dry Run)
```bash
# Preview what would be deleted (recommended first step)
node scripts/clear-memelord-designs.js --dry-run
```

### Execute Cleanup
```bash
# Actually delete the designs and associated data
node scripts/clear-memelord-designs.js --force
```

## What It Does

The script performs a comprehensive cleanup of:

1. **Design Variants** - Deletes all color/product variant mockup images
2. **Design Products** - Removes product configurations 
3. **Design Analytics** - Clears analytics/tracking data
4. **Cloudinary Images** - Removes uploaded design and mockup images
5. **Designs** - Finally deletes the design records themselves

## Safety Features

- **Dry Run Mode**: Default mode shows what would be deleted without making changes
- **Database Validation**: Verifies creator exists before proceeding
- **Error Handling**: Continues processing even if individual images fail to delete
- **Detailed Logging**: Shows progress and results for each design
- **Transaction Safety**: Uses proper database transactions where needed

## Output Example

```
🧹 Memelord Design Cleaner Starting...
Creator ID: 31162d55-0da5-4b13-ad7c-3cafd170cebf
Mode: DRY RUN
──────────────────────────────────────────────────
✅ Database connection established
✅ Creator found: memelord (31162d55-0da5-4b13-ad7c-3cafd170cebf)
📋 Found 6 designs to process

📝 Processing design: "Top Coq Patch Hat" (12d49b48-54d5-464e-9f90-6465161cc254)
   Status: draft, Created: 2025-08-16
   🗑️ Design deleted from database
   ✅ Design processed successfully

==================================================
📊 CLEANUP SUMMARY
==================================================
Items processed:
  • Designs: 6
  • Products: 0
  • Variants: 0
  • Analytics: 0
  • Images: 0

✅ Dry run completed successfully
💡 Run with --force to execute the cleanup
```

## When to Use

- Before importing fresh designs from Sanity
- When you need to reset a creator's design portfolio
- During testing/development to clear test data
- As part of data migration workflows

## Important Notes

- **Irreversible**: Once executed with `--force`, data cannot be recovered
- **Creator Specific**: Only affects the specified memelord creator
- **Image Cleanup**: Removes images from Cloudinary to prevent storage bloat
- **Database Relations**: Properly handles foreign key relationships