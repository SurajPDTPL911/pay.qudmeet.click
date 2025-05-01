import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { admins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { verifyAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // First try to authenticate with the database
    let isAuthenticated = false;

    try {
      // Try to authenticate with the database
      isAuthenticated = await verifyAdmin(email, password);
    } catch (error) {
      console.error('Database authentication error:', error);
    }

    // If database authentication fails, try with environment variables
    if (!isAuthenticated) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      console.log('Trying env variables auth. Email match:', email === adminEmail);

      if (email === adminEmail && password === adminPassword) {
        isAuthenticated = true;
        console.log('Environment variables authentication successful');
      }
    }

    if (isAuthenticated) {
      // Create a response with success message
      const response = NextResponse.json({ success: true });

      // Set the cookie in the response
      response.cookies.set('admin-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
