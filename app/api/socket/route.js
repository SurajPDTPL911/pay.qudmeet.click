import { NextResponse } from 'next/server';
import { SocketEvents } from '@/lib/socketServerless';

// This is a simple API route to handle Socket.io-like functionality in a serverless environment
export async function POST(request) {
  try {
    const body = await request.json();
    const { room, event, message } = body;

    if (!room || !event || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In a real implementation, you would store this message in a database
    // or use a service to deliver it to clients in real-time
    console.log(`[Socket API] Room: ${room}, Event: ${event}, Message:`, message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in socket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
