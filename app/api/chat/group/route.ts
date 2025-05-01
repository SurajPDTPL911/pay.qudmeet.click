import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { groupMessages } from '@/lib/schema';
import { desc } from 'drizzle-orm';

// Get all group messages
export async function GET() {
  try {
    // In Next.js 15, auth() returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get messages from the database
    const messages = await db
      .select({
        id: groupMessages.id,
        senderId: groupMessages.senderId,
        senderName: groupMessages.senderName,
        senderAvatar: groupMessages.senderAvatar,
        content: groupMessages.content,
        timestamp: groupMessages.createdAt,
      })
      .from(groupMessages)
      .orderBy(groupMessages.createdAt)
      .limit(100);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Send a message to the group chat
export async function POST(req: Request) {
  try {
    // In Next.js 15, auth() returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the current user to get their name
    const user = await currentUser();
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get message content from request body
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return new NextResponse('Message content is required', { status: 400 });
    }

    // Insert message into database
    const [message] = await db
      .insert(groupMessages)
      .values({
        senderId: userId,
        senderName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || userId,
        senderAvatar: user.imageUrl || null,
        content,
      })
      .returning();

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending group message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
