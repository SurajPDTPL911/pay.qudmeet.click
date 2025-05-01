import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not found in environment variables' },
        { status: 400 }
      );
    }

    // Get the database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not set' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await hash(adminPassword, 10);

    // Create a new database connection
    const pool = new Pool({ connectionString: databaseUrl });

    // Check if admin table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admins'
      );
    `);

    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      return NextResponse.json(
        { error: 'Admins table does not exist. Please run the migration first.' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Admin user created/updated successfully using SQL',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Error creating admin user with SQL:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
