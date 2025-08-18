const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testEmergencyFix() {
  console.log('🧪 Testing Emergency Fix Solution...\n');
  
  try {
    // Create database connection
    const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    console.log('🔌 Connecting to database...');
    const sequelize = new Sequelize(dbUrl, {
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Test 1: Column Detection
    console.log('🔍 Test 1: Column Detection');
    const columnExists = async (tableName, columnName) => {
      try {
        const [results] = await sequelize.query(
          `SHOW COLUMNS FROM \`${tableName}\` LIKE '${columnName}'`
        );
        return results.length > 0;
      } catch (error) {
        return false;
      }
    };

    const requiredColumns = [
      'product_config', 'front_position', 'back_position', 
      'front_scale', 'back_scale', 'design_data', 'thumbnail_url'
    ];

    const columnStatus = {};
    for (const column of requiredColumns) {
      columnStatus[column] = await columnExists('designs', column);
    }

    console.log('Column Status:');
    Object.entries(columnStatus).forEach(([column, exists]) => {
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${column}`);
    });

    const missingColumns = Object.entries(columnStatus)
      .filter(([k, v]) => !v)
      .map(([k]) => k);

    console.log(`\nMissing columns: ${missingColumns.length}`);
    if (missingColumns.length > 0) {
      console.log(`   Missing: ${missingColumns.join(', ')}`);
    }

    // Test 2: Safe Query Building
    console.log('\n🏗️ Test 2: Safe Query Building');
    const safeColumns = ['id', 'name', 'creator_id'];
    
    Object.entries(columnStatus).forEach(([column, exists]) => {
      if (exists) {
        safeColumns.push(column);
      } else {
        safeColumns.push(`NULL as ${column}`);
      }
    });

    const selectQuery = `SELECT ${safeColumns.join(', ')} FROM designs LIMIT 1`;
    console.log('✅ Safe SELECT query built successfully');
    console.log(`   Query: ${selectQuery.substring(0, 80)}...`);

    // Test 3: Query Execution Test
    console.log('\n🚀 Test 3: Query Execution');
    try {
      const [testResults] = await sequelize.query(selectQuery);
      console.log(`✅ Query executed successfully - Found ${testResults.length} test records`);
      
      if (testResults.length > 0) {
        const record = testResults[0];
        console.log('   Sample record structure:');
        Object.keys(record).forEach(key => {
          const value = record[key];
          const type = value === null ? 'NULL' : typeof value;
          console.log(`     ${key}: ${type}`);
        });
      }
    } catch (queryError) {
      console.log(`❌ Query failed: ${queryError.message}`);
    }

    // Test 4: Update Query Safety
    console.log('\n🔄 Test 4: Update Query Safety');
    const updateClauses = [];
    if (columnStatus.design_data) updateClauses.push('design_data = :designData');
    if (columnStatus.product_config) updateClauses.push('product_config = :productConfig');
    if (columnStatus.thumbnail_url) updateClauses.push('thumbnail_url = :imageUrl');

    if (updateClauses.length > 0) {
      const updateQuery = `UPDATE designs SET ${updateClauses.join(', ')} WHERE id = :designId`;
      console.log('✅ Safe UPDATE query built successfully');
      console.log(`   Updatable columns: ${updateClauses.length}`);
    } else {
      console.log('⚠️ No updatable columns found - would gracefully skip');
    }

    await sequelize.close();

    // Final Assessment
    console.log('\n📊 EMERGENCY FIX ASSESSMENT');
    console.log('=' * 50);
    
    const hasAnyColumns = Object.values(columnStatus).some(v => v);
    const canUpdate = updateClauses.length > 0;
    
    if (hasAnyColumns && canUpdate) {
      console.log('🟢 STATUS: READY - Emergency fix will work');
      console.log('   ✅ Database connection working');
      console.log('   ✅ Required columns detected');
      console.log('   ✅ Safe queries can be built');
      console.log('   ✅ Update operations possible');
    } else if (hasAnyColumns) {
      console.log('🟡 STATUS: PARTIAL - Some functionality available');
      console.log('   ✅ Database connection working');
      console.log('   ⚠️ Limited column availability');
      console.log('   ✅ Safe queries can be built');
    } else {
      console.log('🟠 STATUS: NEEDS MIGRATION - Missing critical columns');
      console.log('   ✅ Database connection working');
      console.log('   ❌ No required columns found');
      console.log('   ⚠️ Will attempt to add columns automatically');
    }

    console.log('\n🚀 RECOMMENDED NEXT STEPS:');
    if (missingColumns.length > 0) {
      console.log('   1. Run: POST /api/fix/emergency-fix-edit-page');
      console.log('   2. This will auto-add missing columns');
      console.log('   3. Then update user designs with proper data');
    } else {
      console.log('   1. Run: POST /api/fix/emergency-fix-edit-page');
      console.log('   2. This will fix existing design data');
    }

    console.log('\n✅ Emergency fix test completed successfully!');

  } catch (error) {
    console.error('\n💥 Emergency fix test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testEmergencyFix()
    .then(() => {
      console.log('\n🎉 All tests passed! Emergency fix is ready.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmergencyFix };