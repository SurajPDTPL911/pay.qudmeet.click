import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMessages, markMessagesAsRead, sendMessage } from '@/lib/chat';
import { getTransactionById } from '@/lib/transactions';

// Get messages for a transaction
export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return new NextResponse('Transaction ID is required', { status: 400 });
    }

    // Verify that the user has access to this transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return new NextResponse('Transaction not found', { status: 404 });
    }

    // Only allow access if the user is a participant in the transaction
    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Get messages
    const messages = await getMessages(transactionId);

    // Mark messages as read
    await markMessagesAsRead(transactionId, userId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Send a message
export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { transactionId, content } = body;

    if (!transactionId || !content) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    // Verify that the user has access to this transaction
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return new NextResponse('Transaction not found', { status: 404 });
    }

    // Only allow access if the user is a participant in the transaction
    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Send message
    const message = await sendMessage(transactionId, userId, content);
    if (!message) {
      return new NextResponse('Failed to send message', { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 