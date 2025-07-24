const fs = require('fs');
const path = require('path');
const db = require('../src/lib/database');
require('dotenv').config();

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    // Read migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`\n📄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await db.query(sql);
        console.log(`✅ Successfully executed: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to execute ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
    
    // Test database connection
    const result = await db.query('SELECT NOW() as current_time');
    console.log(`📊 Database connection test: ${result.rows[0].current_time}`);

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations; 