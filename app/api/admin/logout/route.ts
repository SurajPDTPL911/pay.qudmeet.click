import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Create a response
  const response = NextResponse.json({ success: true });

  // Clear the admin-auth cookie
  response.cookies.set('admin-auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
