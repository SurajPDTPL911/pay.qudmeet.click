import { db } from './db';
import { notifications, users } from './schema';
// Import Socket.io implementation
import { getIO, getUserChannelName, SocketEvents } from './socketClient.js';
import { sendEmail, EmailType } from './email';
import { eq, desc } from 'drizzle-orm';

export enum NotificationType {
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_SENT = 'payment_sent',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
  RECEIPT_READY = 'receipt_ready',
  NEW_MESSAGE = 'new_message',
}

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string;
}

export async function createNotification(
  userId: string,
  data: NotificationData,
  sendEmailNotification: boolean = true
): Promise<boolean> {
  try {
    // 1. Store notification in database
    const [notification] = await db.insert(notifications).values({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      relatedEntityId: data.relatedEntityId,
      isRead: false,
    }).returning();

    // 2. Send real-time notification via Socket.io
    const io = getIO();
    const roomName = getUserChannelName(userId);

    if (io) {
      io.to(roomName).emit(SocketEvents.NOTIFICATION, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        relatedEntityId: notification.relatedEntityId
      });
    }

    // 3. Send email notification if requested
    if (sendEmailNotification) {
      // Get user email
      const [user] = await db.select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

      if (user) {
        // Map notification type to email type
        const emailTypeMap: Record<NotificationType, EmailType> = {
          [NotificationType.PAYMENT_RECEIVED]: EmailType.PAYMENT_RECEIVED,
          [NotificationType.PAYMENT_SENT]: EmailType.PAYMENT_SENT,
          [NotificationType.TRANSACTION_COMPLETED]: EmailType.TRANSACTION_COMPLETED,
          [NotificationType.RECEIPT_READY]: EmailType.RECEIPT_READY,
          [NotificationType.TRANSACTION_FAILED]: EmailType.TRANSACTION_COMPLETED,
          [NotificationType.NEW_MESSAGE]: EmailType.TRANSACTION_COMPLETED,
        };

        const emailType = emailTypeMap[data.type];
        // Only send email if we have a matching email type
        if (emailType) {
          await sendEmail(emailType, {
            name: user.name,
            ...data,
          }, user.email);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  try {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return userNotifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}