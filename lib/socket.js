// JavaScript version of the socket.ts file
import { Server } from 'socket.io';

let io = null;

// Event types for type safety
export const SocketEvents = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  NOTIFICATION: 'notification',
  TRANSACTION_UPDATE: 'transaction-update',
};

// Initialize Socket.io server
export function initSocketServer(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? 'https://pay.qudmeet.click' 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Join a room (transaction or user)
      socket.on(SocketEvents.JOIN_ROOM, (room) => {
        console.log(`Socket ${socket.id} joining room: ${room}`);
        socket.join(room);
      });
      
      // Leave a room
      socket.on(SocketEvents.LEAVE_ROOM, (room) => {
        console.log(`Socket ${socket.id} leaving room: ${room}`);
        socket.leave(room);
      });
      
      // Send a message to a room
      socket.on(SocketEvents.SEND_MESSAGE, (data) => {
        console.log(`Message sent to room ${data.room}:`, data.message);
        io.to(data.room).emit(SocketEvents.NEW_MESSAGE, data.message);
      });
      
      // Disconnect event
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  return io;
}

// Get the Socket.io instance
export function getIO() {
  return io;
}

// Helper functions for channel/room names (similar to the Pusher implementation)
export const getTransactionChannelName = (transactionId) => 
  `transaction-${transactionId}`;

export const getUserChannelName = (userId) => 
  `user-${userId}`;
