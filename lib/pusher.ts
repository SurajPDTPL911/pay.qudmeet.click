import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

// Client-side Pusher instance
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  }
);

// Channel names for transactions and notifications
export const getTransactionChannelName = (transactionId: string) => 
  `transaction-${transactionId}`;

export const getUserChannelName = (userId: string) => 
  `user-${userId}`;

// Event types
export enum PusherEvents {
  MESSAGE = 'message',
  STATUS_UPDATE = 'status-update',
  NOTIFICATION = 'notification',
}

// Helper function to trigger an event on a channel
export async function triggerEvent(
  channelName: string, 
  eventName: PusherEvents, 
  data: any
) {
  try {
    await pusher.trigger(channelName, eventName, data);
    return true;
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    return false;
  }
} 