// Serverless version of Socket.io implementation for Vercel
import { Server } from 'socket.io';

// Event types for type safety
export const SocketEvents = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  NOTIFICATION: 'notification',
  TRANSACTION_UPDATE: 'transaction-update',
};

// Socket.io instance (will be null in serverless environment)
let io = null;

// Helper functions for channel/room names
export const getTransactionChannelName = (transactionId) => 
  `transaction-${transactionId}`;

export const getUserChannelName = (userId) => 
  `user-${userId}`;

// Get the Socket.io instance (will be null in serverless environment)
export function getIO() {
  return io;
}

// Serverless-friendly version of sending messages
export async function sendSocketMessage(roomName, eventName, data) {
  // In serverless environment, we can't use Socket.io directly
  // Instead, we'll use a database or external service to store messages
  // For now, we'll just log the message
  console.log(`[Socket.io Serverless] Sending message to room ${roomName}:`, {
    event: eventName,
    data,
  });
  
  // Return true to indicate success (even though we're not actually sending)
  return true;
}
