// This script creates an admin user directly in the database
// Run it with: node scripts/create-admin.js

const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createAdmin() {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const databaseUrl = process.env.DATABASE_URL;

    if (!adminEmail || !adminPassword) {
      console.error('Error: Admin credentials not found in environment variables');
      console.error('Make sure ADMIN_EMAIL and ADMIN_PASSWORD are set in your .env.local file');
      process.exit(1);
    }

    if (!databaseUrl) {
      console.error('Error: DATABASE_URL environment variable is not set');
      console.error('Make sure DATABASE_URL is set in your .env.local file');
      process.exit(1);
    }

    console.log(`Creating admin user with email: ${adminEmail}`);

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log('Password hashed successfully');

    // Create a new database connection
    const pool = new Pool({ connectionString: databaseUrl });
    console.log('Connected to database');

    // Check if admin table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);

    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.error('Error: Admins table does not exist. Please run the migration first.');
      process.exit(1);
    }

    console.log('Admins table exists, proceeding with admin creation');

    // Try to insert or update admin user using raw SQL
    const result = await pool.query(`
      INSERT INTO admins (username, email, password_hash)
      VALUES ('admin', $1, $2)
      ON CONFLICT (username) 
      DO UPDATE SET 
        email = $1,
        password_hash = $2
      RETURNING id, username, email;
    `, [adminEmail, passwordHash]);

    const admin = result.rows[0];

    console.log('Admin user created/updated successfully:');
    console.log(`- ID: ${admin.id}`);
    console.log(`- Username: ${admin.username}`);
    console.log(`- Email: ${admin.email}`);
    console.log('\nYou can now log in with these credentials at /admin/login');

    await pool.end();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
