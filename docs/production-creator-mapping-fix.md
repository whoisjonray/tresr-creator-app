# Production Creator Mapping Fix

## Problem

The production creator app at https://creators.tresr.com is returning 0 designs when users log in, specifically for Jon Ray (whoisjonray@gmail.com). The issue stems from a missing mapping between:

- **Dynamic.xyz ID**: `31162d55-0da5-4b13-ad7c-3cafd170cebf` (Authentication system)
- **Sanity person ID**: `k2r2aa8vmghuyr3he0p2eo5e` (Content management system)

## Root Cause

The production database lacks the `creator_mappings` table data that connects Dynamic.xyz user authentication with Sanity CMS content. Without this mapping:

1. User logs in successfully with Dynamic.xyz 
2. Application tries to fetch designs for their Dynamic.xyz ID
3. No mapping exists to find their Sanity person ID
4. Query returns 0 designs even though designs exist in Sanity

## Solution

### Scripts Created

1. **Environment Check**: `scripts/check-production-env.js`
   - Validates production environment configuration
   - Checks required database credentials

2. **Database Diagnosis**: `scripts/diagnose-production-database.js`
   - Analyzes current production database state
   - Identifies missing tables and data
   - Provides detailed diagnosis of the issue

3. **Creator Mapping Population**: `scripts/populate-production-creator-mappings.js`
   - Creates `creator_mappings` table if missing
   - Populates mapping for Jon Ray (memelord)
   - Supports additional creators as needed

4. **Complete Fix**: `scripts/fix-production-creator-mappings.sh`
   - Runs all scripts in sequence
   - Provides comprehensive fix and verification

### Database Schema

The `creator_mappings` table structure:

```sql
CREATE TABLE creator_mappings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sanity_person_id VARCHAR(255) UNIQUE NOT NULL,
  dynamic_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  sanity_name VARCHAR(255),
  sanity_username VARCHAR(255),
  sanity_wallet_address VARCHAR(255),
  sanity_wallets JSON DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP NULL,
  metadata JSON DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Critical Mapping

For Jon Ray (memelord):
```json
{
  "sanityPersonId": "k2r2aa8vmghuyr3he0p2eo5e",
  "dynamicId": "31162d55-0da5-4b13-ad7c-3cafd170cebf",
  "email": "whoisjonray@gmail.com",
  "sanityName": "memelord",
  "isVerified": true
}
```

## Usage

### Quick Fix (Recommended)

```bash
# Run complete fix
./scripts/fix-production-creator-mappings.sh
```

### Step-by-Step

```bash
# 1. Check environment
node scripts/check-production-env.js

# 2. Diagnose current state
node scripts/diagnose-production-database.js

# 3. Populate mappings
node scripts/populate-production-creator-mappings.js

# 4. Verify fix
node scripts/diagnose-production-database.js
```

## Verification

After running the fix:

1. **Test Login**: Visit https://creators.tresr.com
2. **Login as Jon**: Use whoisjonray@gmail.com
3. **Check Designs**: Verify designs load (should be > 0)
4. **Check Console**: No errors in browser developer tools

## Additional Considerations

### If Still 0 Designs After Fix

The mapping fix addresses the user identification issue. If designs still don't appear, check:

1. **Designs Table**: Ensure designs exist in production database
2. **Import Process**: Run Sanity import to populate designs
3. **Authentication Flow**: Verify Dynamic.xyz authentication works
4. **API Endpoints**: Check server logs for API errors

### Import Designs from Sanity

If the mappings are correct but no designs exist:

```bash
# Use the direct import endpoint
curl -X POST https://creators.tresr.com/api/direct-import/import-memelord-direct \
  -H "Content-Type: application/json" \
  --cookie "session=..." # Include valid session cookie
```

### Environment Requirements

Production environment must have:
- `MYSQL_URL` or `DATABASE_URL`: Production database connection
- `SANITY_PROJECT_ID`: For design imports
- `DYNAMIC_AUTH_URL`: For authentication
- `CLOUDINARY_*`: For image handling

## Architecture Flow

```
1. User logs in → Dynamic.xyz Authentication
2. Session created → Dynamic ID stored in session
3. API request → Uses Dynamic ID from session
4. Database lookup → creator_mappings table maps Dynamic ID → Sanity person ID
5. Designs query → Uses Sanity person ID to find designs
6. Results returned → Designs displayed to user
```

The fix ensures step 4 works correctly by populating the mapping table.

## Future Maintenance

- **New Creators**: Add mappings when new creators join
- **Data Sync**: Periodically sync creator data from Sanity
- **Monitoring**: Set up alerts for 0 design responses
- **Backup**: Regular database backups including mapping data

## Files Modified/Created

- `scripts/check-production-env.js` - Environment validation
- `scripts/diagnose-production-database.js` - Database diagnosis  
- `scripts/populate-production-creator-mappings.js` - Mapping population
- `scripts/fix-production-creator-mappings.sh` - Complete fix script
- `docs/production-creator-mapping-fix.md` - This documentation

## Security Notes

- Scripts use production database credentials securely
- No sensitive data logged in clear text
- Database connections properly closed
- Environment variables masked in output