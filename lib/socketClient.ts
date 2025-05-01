import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define SocketEvents here to avoid importing from server-side code
export enum SocketEvents {
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  SEND_MESSAGE = 'send-message',
  NEW_MESSAGE = 'new-message',
  NOTIFICATION = 'notification',
  TRANSACTION_UPDATE = 'transaction-update',
};

// Singleton socket instance
let socket: Socket | null = null;

// Initialize socket connection
export function initSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://pay.qudmeet.click'
      : 'http://localhost:3000';

    socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  return socket;
}

// Hook to use socket in components
export function useSocket(): Socket {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = initSocket();
    setSocketInstance(socket);

    return () => {
      // Don't disconnect on component unmount, as we're using a singleton
      // This allows the socket to be reused across components
    };
  }, []);

  return socketInstance as Socket;
}

// Join a room (transaction or user)
export function joinRoom(roomName: string): void {
  const socket = initSocket();
  socket.emit(SocketEvents.JOIN_ROOM, roomName);
}

// Leave a room
export function leaveRoom(roomName: string): void {
  const socket = initSocket();
  socket.emit(SocketEvents.LEAVE_ROOM, roomName);
}

// Send a message to a room
export function sendMessage(roomName: string, message: any): void {
  const socket = initSocket();
  socket.emit(SocketEvents.SEND_MESSAGE, {
    room: roomName,
    message,
  });
}

// Get the Socket.io instance (for server-side code)
export function getIO(): null {
  // This is a client-side implementation, so it returns null
  return null;
}

// Helper functions for channel/room names (same as server-side)
export const getTransactionChannelName = (transactionId: string): string =>
  `transaction-${transactionId}`;

export const getUserChannelName = (userId: string): string =>
  `user-${userId}`;
