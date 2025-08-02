# Database Backup Strategy

## Overview
Implement automated backup and restore procedures for Railway MySQL database.

## Priority: HIGH
- **Implementation Time**: 3 days
- **Impact**: Disaster recovery capability, data loss prevention
- **Cost**: Minimal (S3 storage for backups)

## Current Risk Assessment

- **No backups**: Complete data loss if Railway database fails
- **No restore procedure**: Manual recreation would take days
- **Creator trust**: Data loss would destroy creator confidence

## Backup Strategy

### 1. Automated Daily Backups

```javascript
// server/scripts/backup-database.js
const mysqldump = require('mysqldump');
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

async function backupDatabase() {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = `tresr-creator-backup-${timestamp}.sql`;
  const filepath = path.join('/tmp', filename);

  console.log(`🔄 Starting database backup: ${filename}`);

  try {
    // Step 1: Create MySQL dump
    await mysqldump({
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      },
      dumpToFile: filepath,
      compressFile: true,
    });

    console.log('✅ Database dump created successfully');

    // Step 2: Upload to S3
    const fileContent = await fs.readFile(`${filepath}.gz`);
    
    const uploadParams = {
      Bucket: process.env.BACKUP_BUCKET || 'tresr-creator-backups',
      Key: `database/${filename}.gz`,
      Body: fileContent,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA', // Infrequent access for cost savings
      Metadata: {
        'backup-date': timestamp,
        'database': process.env.DB_NAME,
        'environment': process.env.NODE_ENV || 'production'
      }
    };

    await s3.upload(uploadParams).promise();
    console.log('✅ Backup uploaded to S3 successfully');

    // Step 3: Cleanup local file
    await fs.unlink(`${filepath}.gz`);

    // Step 4: Maintain backup retention (keep last 30 days)
    await cleanupOldBackups();

    return {
      success: true,
      filename: `${filename}.gz`,
      size: fileContent.length,
      timestamp
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function cleanupOldBackups() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const listParams = {
    Bucket: process.env.BACKUP_BUCKET || 'tresr-creator-backups',
    Prefix: 'database/'
  };

  const objects = await s3.listObjectsV2(listParams).promise();
  
  const objectsToDelete = objects.Contents
    .filter(obj => new Date(obj.LastModified) < thirtyDaysAgo)
    .map(obj => ({ Key: obj.Key }));

  if (objectsToDelete.length > 0) {
    await s3.deleteObjects({
      Bucket: listParams.Bucket,
      Delete: { Objects: objectsToDelete }
    }).promise();
    
    console.log(`🗑️ Deleted ${objectsToDelete.length} old backups`);
  }
}

// Run backup if called directly
if (require.main === module) {
  backupDatabase()
    .then(result => {
      console.log('✅ Backup completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { backupDatabase };
```

### 2. Restore Procedure

```javascript
// server/scripts/restore-database.js
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

async function listBackups() {
  const listParams = {
    Bucket: process.env.BACKUP_BUCKET || 'tresr-creator-backups',
    Prefix: 'database/',
    MaxKeys: 10
  };

  const objects = await s3.listObjectsV2(listParams).promise();
  
  return objects.Contents
    .sort((a, b) => b.LastModified - a.LastModified)
    .map(obj => ({
      key: obj.Key,
      filename: obj.Key.split('/').pop(),
      date: obj.LastModified,
      size: obj.Size
    }));
}

async function restoreDatabase(backupKey) {
  const filename = backupKey.split('/').pop();
  const filepath = path.join('/tmp', filename);

  console.log(`🔄 Starting database restore from: ${filename}`);

  try {
    // Step 1: Download backup from S3
    const downloadParams = {
      Bucket: process.env.BACKUP_BUCKET || 'tresr-creator-backups',
      Key: backupKey
    };

    const data = await s3.getObject(downloadParams).promise();
    await fs.writeFile(filepath, data.Body);
    
    console.log('✅ Backup downloaded successfully');

    // Step 2: Decompress if needed
    let sqlFile = filepath;
    if (filepath.endsWith('.gz')) {
      await execPromise(`gunzip ${filepath}`);
      sqlFile = filepath.replace('.gz', '');
    }

    // Step 3: Create restore script with safety checks
    const restoreScript = `
      -- Safety check: backup current data first
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}_backup_before_restore;
      
      -- Restore process
      USE ${process.env.DB_NAME};
      SOURCE ${sqlFile};
    `;

    // Step 4: Execute restore
    const mysqlCommand = `mysql -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD}`;
    
    await execPromise(`echo "${restoreScript}" | ${mysqlCommand}`);
    
    console.log('✅ Database restored successfully');

    // Step 5: Cleanup
    await fs.unlink(sqlFile);

    return {
      success: true,
      restoredFrom: filename,
      timestamp: new Date()
    };

  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'list') {
    listBackups()
      .then(backups => {
        console.log('\n📦 Available backups:');
        backups.forEach((backup, index) => {
          console.log(`${index + 1}. ${backup.filename} - ${backup.date.toLocaleString()} (${(backup.size / 1024 / 1024).toFixed(2)} MB)`);
        });
      })
      .catch(console.error);
  } else if (command === 'restore') {
    const backupIndex = parseInt(process.argv[3]) - 1;
    
    listBackups()
      .then(async backups => {
        if (backupIndex >= 0 && backupIndex < backups.length) {
          const backup = backups[backupIndex];
          console.log(`\n⚠️  WARNING: This will restore from ${backup.filename}`);
          console.log('Current data will be backed up first.');
          console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          return restoreDatabase(backup.key);
        } else {
          throw new Error('Invalid backup index');
        }
      })
      .then(result => {
        console.log('✅ Restore completed:', result);
      })
      .catch(console.error);
  } else {
    console.log(`
Usage:
  node restore-database.js list                    # List available backups
  node restore-database.js restore <number>        # Restore specific backup
    `);
  }
}

module.exports = { listBackups, restoreDatabase };
```

### 3. Automated Backup Scheduler

```javascript
// server/services/backupScheduler.js
const cron = require('node-cron');
const { backupDatabase } = require('../scripts/backup-database');
const { trackError } = require('../utils/errorTracking');

class BackupScheduler {
  static schedule() {
    // Daily backup at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('🕐 Starting scheduled database backup...');
      
      try {
        const result = await backupDatabase();
        console.log('✅ Scheduled backup completed:', result);
        
        // Optional: Send notification
        await this.notifyBackupSuccess(result);
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
        trackError(error, { 
          section: 'backup_scheduler',
          type: 'scheduled_backup_failure' 
        });
        
        // Alert team
        await this.notifyBackupFailure(error);
      }
    });

    console.log('📅 Backup scheduler initialized (daily at 3 AM)');
  }

  static async notifyBackupSuccess(result) {
    // Implement Slack/email notification
    // Example: POST to webhook with backup details
  }

  static async notifyBackupFailure(error) {
    // Implement urgent alert
    // Example: Send email/SMS to admin
  }
}

module.exports = BackupScheduler;
```

### 4. Add to Main Server

```javascript
// server/index.js
const BackupScheduler = require('./services/backupScheduler');

// After server starts
if (process.env.NODE_ENV === 'production') {
  BackupScheduler.schedule();
}
```

### 5. Manual Backup Endpoint

```javascript
// server/routes/admin.js
const { backupDatabase } = require('../scripts/backup-database');

router.post('/backup', requireAdmin, async (req, res) => {
  try {
    const result = await backupDatabase();
    res.json({
      success: true,
      backup: result,
      message: 'Manual backup completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Backup failed',
      message: error.message
    });
  }
});
```

## Backup Testing Procedures

### 1. Test Backup Creation
```bash
cd server
node scripts/backup-database.js
```

### 2. Test Restore Process
```bash
# List available backups
node scripts/restore-database.js list

# Restore specific backup
node scripts/restore-database.js restore 1
```

### 3. Verify Data Integrity
```sql
-- Check row counts
SELECT 'creators' as table_name, COUNT(*) as count FROM creators
UNION ALL
SELECT 'designs', COUNT(*) FROM designs
UNION ALL
SELECT 'design_products', COUNT(*) FROM design_products
UNION ALL
SELECT 'design_variants', COUNT(*) FROM design_variants;
```

## Disaster Recovery Runbook

### Scenario 1: Complete Database Failure

1. **Assess the situation**
   ```bash
   # Check database connectivity
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
   ```

2. **Create new database if needed**
   ```bash
   # Railway CLI or dashboard
   railway mysql create
   ```

3. **Restore from latest backup**
   ```bash
   node scripts/restore-database.js list
   node scripts/restore-database.js restore 1
   ```

4. **Verify application functionality**
   - Test creator login
   - Check design loading
   - Verify product creation

### Scenario 2: Data Corruption

1. **Identify corrupted tables**
   ```sql
   CHECK TABLE creators, designs, design_products, design_variants;
   ```

2. **Restore specific tables**
   ```bash
   # Extract specific tables from backup
   zcat backup.sql.gz | sed -n '/CREATE TABLE `designs`/,/UNLOCK TABLES/p' > designs_only.sql
   mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < designs_only.sql
   ```

## Monitoring & Alerts

### Backup Success Metrics
- Last successful backup timestamp
- Backup file size trends
- Backup duration
- S3 storage usage

### Alert Conditions
- No backup in 48 hours
- Backup size deviation > 50%
- Backup duration > 30 minutes
- S3 upload failures

## Cost Optimization

### S3 Storage Classes
- **Days 0-30**: STANDARD_IA ($0.0125/GB)
- **Days 31-90**: GLACIER ($0.004/GB)
- **Days 91+**: DEEP_ARCHIVE ($0.00099/GB)

### Estimated Monthly Cost
- Daily backups: ~1GB each
- 30 days retention: ~$0.38/month
- 90 days with tiering: ~$0.50/month

## Security Considerations

1. **Encryption**: All backups encrypted at rest (AES256)
2. **Access Control**: S3 bucket with strict IAM policies
3. **Audit Trail**: CloudTrail logs all backup access
4. **Secure Transfer**: SSL/TLS for all S3 operations

## Next Steps

1. **Week 1**: Implement basic backup/restore scripts
2. **Week 2**: Add scheduling and monitoring
3. **Week 3**: Test disaster recovery procedures
4. **Month 2**: Add point-in-time recovery capability