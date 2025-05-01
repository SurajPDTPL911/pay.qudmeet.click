import { NextResponse } from 'next/server';
import { runMigration } from '@/lib/migrate';
import { cookies } from 'next/headers';

async function isAdmin() {
  // In Next.js 15, cookies() returns a Promise
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin-auth')?.value;
  return adminAuth === 'true';
}

export async function POST(req: Request) {
  try {
    // For security, we'll check if the request has a secret key
    // This is to prevent unauthorized access to the migration endpoint
    const { searchParams } = new URL(req.url);
    const secretKey = searchParams.get('key');
    
    // Check if the secret key matches the environment variable
    // Or if the user is an admin
    const admin = await isAdmin();
    const validKey = secretKey === process.env.MIGRATION_SECRET_KEY;
    
    if (!admin && !validKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Run the migration
    const result = await runMigration();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
