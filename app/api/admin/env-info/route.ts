import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      adminEmail: process.env.ADMIN_EMAIL || 'Not set',
    });
  } catch (error) {
    console.error('Error fetching environment info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
