import { db } from './db';
import { chatMessages, transactions } from './schema';
import { eq, desc, and, ne } from 'drizzle-orm';
// Import Socket.io implementation
import { getIO, getTransactionChannelName, SocketEvents } from './socketClient.js';
import { NotificationType, createNotification } from './notifications';

export interface ChatMessage {
  id: number;
  transactionId: string;
  senderId: string;
  content: string;
  isRead: boolean | null;
  createdAt: Date | null;
}

// Send a message in a transaction chat
export async function sendMessage(
  transactionId: string,
  senderId: string,
  content: string
): Promise<ChatMessage | null> {
  try {
    // Insert message into database
    const [message] = await db.insert(chatMessages).values({
      transactionId,
      senderId,
      content,
      isRead: false,
    }).returning();

    // Send real-time message via Socket.io
    // In serverless environment, we can't use Socket.io directly
    // This is handled by the API route instead
    try {
      const io = getIO();
      const roomName = getTransactionChannelName(transactionId);

      // Log the message for debugging
      console.log(`[Socket] Sending message to room ${roomName}:`, {
        id: message.id,
        senderId: message.senderId,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      });
    } catch (error) {
      console.error('Error with Socket.io:', error);
      // Continue execution even if Socket.io fails
    }

    // Create notification for the recipient
    // First we need to get the transaction to know the other party
    const [transaction] = await db.select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId))
      .limit(1);

    if (transaction) {
      // Determine recipient (the other party in the transaction)
      const recipientId = senderId === transaction.senderId
        ? transaction.receiverId
        : transaction.senderId;

      // Only notify if the recipient is a real user (not PENDING)
      if (recipientId !== 'PENDING') {
        await createNotification(recipientId, {
          title: 'New Message',
          message: `You have a new message in your transaction chat.`,
          type: NotificationType.NEW_MESSAGE,
          relatedEntityId: transactionId,
        });
      }
    }

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// Get messages for a transaction
export async function getMessages(
  transactionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.transactionId, transactionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  transactionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Update all messages from other users to read
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.transactionId, transactionId),
          ne(chatMessages.senderId, userId),
          eq(chatMessages.isRead, false)
        )
      );

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}