// JavaScript version of the socketClient.ts file
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Define SocketEvents here to avoid importing from server-side code
export const SocketEvents = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  NOTIFICATION: 'notification',
  TRANSACTION_UPDATE: 'transaction-update',
};

// Singleton socket instance
let socket = null;

// Initialize socket connection
export function initSocket() {
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
export function useSocket() {
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    const socket = initSocket();
    setSocketInstance(socket);

    return () => {
      // Don't disconnect on component unmount, as we're using a singleton
      // This allows the socket to be reused across components
    };
  }, []);

  return socketInstance;
}

// Join a room (transaction or user)
export function joinRoom(roomName) {
  const socket = initSocket();
  socket.emit(SocketEvents.JOIN_ROOM, roomName);
}

// Leave a room
export function leaveRoom(roomName) {
  const socket = initSocket();
  socket.emit(SocketEvents.LEAVE_ROOM, roomName);
}

// Send a message to a room
export function sendMessage(roomName, message) {
  const socket = initSocket();
  socket.emit(SocketEvents.SEND_MESSAGE, {
    room: roomName,
    message,
  });
}

// Helper functions for channel/room names (same as server-side)
export const getTransactionChannelName = (transactionId) =>
  `transaction-${transactionId}`;

export const getUserChannelName = (userId) =>
  `user-${userId}`;
