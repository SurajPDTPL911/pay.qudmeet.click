import { db } from './db';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool } from '@neondatabase/serverless';

// This script will create all the tables defined in the schema
export async function runMigration() {
  console.log('Starting database migration...');
  
  try {
    // Get the database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create a new database connection
    const pool = new Pool({ connectionString: databaseUrl });
    const migrationDb = drizzle(pool);
    
    // Run the migration
    console.log('Creating tables...');
    
    // Create the status enum type first
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
          CREATE TYPE status AS ENUM ('awaiting_payment', 'payment_received', 'transfer_in_progress', 'completed', 'failed');
        END IF;
      END
      $$;
    `);
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        school_name VARCHAR(255),
        profile_picture VARCHAR(255),
        phone_number VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        amount_sent NUMERIC NOT NULL,
        amount_received NUMERIC NOT NULL,
        fee NUMERIC NOT NULL DEFAULT 50,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        status status DEFAULT 'awaiting_payment',
        receipt_url VARCHAR(255),
        payment_screenshot_url VARCHAR(255),
        receiver_name VARCHAR(255),
        receiver_account_number VARCHAR(50),
        receiver_bank_name VARCHAR(255),
        receiver_phone_number VARCHAR(50),
        payment_account_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    
    // Create exchange_rates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        rate NUMERIC NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create chat_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create group_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create payment_accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_accounts (
        id SERIAL PRIMARY KEY,
        account_type VARCHAR(50) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        bank_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_entity_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create receipts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(50) NOT NULL,
        blob_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add foreign key constraint
    await pool.query(`
      ALTER TABLE transactions 
      ADD CONSTRAINT fk_payment_account 
      FOREIGN KEY (payment_account_id) 
      REFERENCES payment_accounts(id);
    `);
    
    // Insert default admin user
    await pool.query(`
      INSERT INTO admins (username, password_hash, email)
      VALUES ('admin', '$2a$10$JdJF1JFvPYMvZjR.Mw5K5.U.Y.3XVGK2xV8q5jPMqIQJa.5DQHMG.', 'admin@pay.qudmeet.click')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    // Insert default exchange rates
    await pool.query(`
      INSERT INTO exchange_rates (from_currency, to_currency, rate)
      VALUES 
        ('NGN', 'INR', 0.34),
        ('INR', 'NGN', 2.94)
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('Migration completed successfully!');
    
    return { success: true, message: 'Migration completed successfully!' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: `Migration failed: ${error.message}` };
  }
}
