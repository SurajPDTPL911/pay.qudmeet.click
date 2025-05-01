'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { SendHorizontal } from 'lucide-react';
import { useSocket, getTransactionChannelName, SocketEvents } from '@/lib/socketClient.js';

interface Message {
  id: number;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ChatInterfaceProps {
  transactionId: string;
}

export default function ChatInterface({ transactionId }: ChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when component mounts
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/chat?transactionId=${transactionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [transactionId]);

  // Setup Socket.io for real-time updates
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      const roomName = getTransactionChannelName(transactionId);

      // Join the transaction room
      socket.emit(SocketEvents.JOIN_ROOM, roomName);

      // Listen for new messages
      socket.on(SocketEvents.NEW_MESSAGE, (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        // Leave the room when component unmounts
        socket.emit(SocketEvents.LEAVE_ROOM, roomName);
        socket.off(SocketEvents.NEW_MESSAGE);
      };
    }
  }, [socket, transactionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Clear input field
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (isLoading) {
    return (
      <div className="h-80 border rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col h-96">
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 rounded-bl-none'
                  }`}>
                    <div className="break-words">{message.content}</div>
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}