import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notifications';

// Get all notifications for current user
export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const notifications = await getUserNotifications(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Mark notification as read
export async function PATCH(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new NextResponse('Notification ID is required', { status: 400 });
    }

    const result = await markNotificationAsRead(id);
    if (!result) {
      return new NextResponse('Failed to mark notification as read', { status: 400 });
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 