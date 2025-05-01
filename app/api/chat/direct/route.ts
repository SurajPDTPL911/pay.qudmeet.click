import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { directMessages, conversations, users } from '@/lib/schema';
import { desc, and, or, eq, sql } from 'drizzle-orm';

// Get direct messages between two users
export async function GET(req: Request) {
  try {
    // In Next.js 15, auth() returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      // If no specific user is provided, return all conversations
      const userConversations = await db
        .select({
          id: conversations.id,
          participant1Id: conversations.participant1Id,
          participant2Id: conversations.participant2Id,
          lastMessageAt: conversations.lastMessageAt,
        })
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));

      // Get user details for each conversation
      const conversationsWithDetails = await Promise.all(
        userConversations.map(async (conversation) => {
          const otherParticipantId = conversation.participant1Id === userId 
            ? conversation.participant2Id 
            : conversation.participant1Id;
          
          // Get the other user's details
          const [otherUser] = await db
            .select({
              name: users.name,
              profilePicture: users.profilePicture,
              clerkId: users.clerkId,
            })
            .from(users)
            .where(eq(users.clerkId, otherParticipantId))
            .limit(1);

          // Get the last message
          const [lastMessage] = await db
            .select({
              content: directMessages.content,
              senderId: directMessages.senderId,
              createdAt: directMessages.createdAt,
            })
            .from(directMessages)
            .where(
              and(
                or(
                  and(
                    eq(directMessages.senderId, userId),
                    eq(directMessages.receiverId, otherParticipantId)
                  ),
                  and(
                    eq(directMessages.senderId, otherParticipantId),
                    eq(directMessages.receiverId, userId)
                  )
                )
              )
            )
            .orderBy(desc(directMessages.createdAt))
            .limit(1);

          return {
            id: conversation.id,
            otherUser: {
              id: otherUser?.clerkId || otherParticipantId,
              name: otherUser?.name || 'Unknown User',
              profilePicture: otherUser?.profilePicture || null,
            },
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              isFromMe: lastMessage.senderId === userId,
              createdAt: lastMessage.createdAt,
            } : null,
          };
        })
      );

      return NextResponse.json(conversationsWithDetails);
    }

    // Get or create conversation
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, otherUserId)
          ),
          and(
            eq(conversations.participant1Id, otherUserId),
            eq(conversations.participant2Id, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          participant1Id: userId,
          participant2Id: otherUserId,
        })
        .returning();
      
      conversation = [newConversation];
    }

    // Get messages
    const messages = await db
      .select({
        id: directMessages.id,
        senderId: directMessages.senderId,
        content: directMessages.content,
        isRead: directMessages.isRead,
        createdAt: directMessages.createdAt,
      })
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, userId),
            eq(directMessages.receiverId, otherUserId)
          ),
          and(
            eq(directMessages.senderId, otherUserId),
            eq(directMessages.receiverId, userId)
          )
        )
      )
      .orderBy(directMessages.createdAt);

    // Mark messages as read
    await db
      .update(directMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(directMessages.senderId, otherUserId),
          eq(directMessages.receiverId, userId),
          eq(directMessages.isRead, false)
        )
      );

    // Get sender details
    const [otherUser] = await db
      .select({
        name: users.name,
        profilePicture: users.profilePicture,
      })
      .from(users)
      .where(eq(users.clerkId, otherUserId))
      .limit(1);

    return NextResponse.json({
      conversationId: conversation[0].id,
      otherUser: {
        id: otherUserId,
        name: otherUser?.name || 'Unknown User',
        profilePicture: otherUser?.profilePicture || null,
      },
      messages,
    });
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Send a direct message
export async function POST(req: Request) {
  try {
    // In Next.js 15, auth() returns a Promise
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the current user
    const user = await currentUser();
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get message content and receiver from request body
    const body = await req.json();
    const { content, receiverId } = body;

    if (!content || content.trim() === '' || !receiverId) {
      return new NextResponse('Message content and receiver ID are required', { status: 400 });
    }

    // Get or create conversation
    let conversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, receiverId)
          ),
          and(
            eq(conversations.participant1Id, receiverId),
            eq(conversations.participant2Id, userId)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          participant1Id: userId,
          participant2Id: receiverId,
        })
        .returning();
      
      conversation = [newConversation];
    } else {
      // Update last message timestamp
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversation[0].id));
    }

    // Insert message
    const [message] = await db
      .insert(directMessages)
      .values({
        senderId: userId,
        receiverId,
        content,
        isRead: false,
      })
      .returning();

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending direct message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
