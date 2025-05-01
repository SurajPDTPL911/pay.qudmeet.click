// JavaScript version of the socketClient.ts file
// This file is used by both client and server-side code
// React hooks are only used on the client side

// Import React hooks only on client side
let useEffect, useState;
let io;

if (typeof window !== 'undefined') {
  // Client-side only imports
  import('react').then(React => {
    useEffect = React.useEffect;
    useState = React.useState;
  });

  import('socket.io-client').then(socketIO => {
    io = socketIO.io;
  });
}

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

// Initialize socket connection (client-side only)
export function initSocket() {
  // Return null on server-side
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socket && io) {
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

// Hook to use socket in components (client-side only)
export function useSocket() {
  // Server-side check
  if (typeof window === 'undefined') {
    return null;
  }

  // This will be undefined during SSR, but that's okay
  // It will be defined on the client
  if (!useState || !useEffect) {
    console.warn('React hooks not available yet');
    return null;
  }

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

// Get the Socket.io instance (for server-side code)
export function getIO() {
  // This is a client-side implementation, so it returns null
  return null;
}

// Join a room (transaction or user)
export function joinRoom(roomName) {
  const socket = initSocket();
  if (socket) {
    socket.emit(SocketEvents.JOIN_ROOM, roomName);
  }
}

// Leave a room
export function leaveRoom(roomName) {
  const socket = initSocket();
  if (socket) {
    socket.emit(SocketEvents.LEAVE_ROOM, roomName);
  }
}

// Send a message to a room
export function sendMessage(roomName, message) {
  const socket = initSocket();
  if (socket) {
    socket.emit(SocketEvents.SEND_MESSAGE, {
      room: roomName,
      message,
    });
  }
}

// Helper functions for channel/room names (same as server-side)
export const getTransactionChannelName = (transactionId) =>
  `transaction-${transactionId}`;

export const getUserChannelName = (userId) =>
  `user-${userId}`;
