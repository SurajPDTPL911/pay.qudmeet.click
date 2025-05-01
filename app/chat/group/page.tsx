'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
};

export default function GroupChatPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect to login if not signed in
    if (!isSignedIn && !loading) {
      router.push('/sign-in');
    }
  }, [isSignedIn, router, loading]);

  useEffect(() => {
    // Fetch messages
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat/group');
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchMessages();
      
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isSignedIn) return;
    
    try {
      const res = await fetch('/api/chat/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });
      
      if (res.ok) {
        // Add message to UI immediately for better UX
        const tempMessage: Message = {
          id: Date.now().toString(),
          senderId: user?.id || '',
          senderName: user?.fullName || user?.username || 'You',
          content: newMessage,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage('');
        
        // Fetch updated messages
        const updatedRes = await fetch('/api/chat/group');
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setMessages(data);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isSignedIn && !loading) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Group Chat</h1>
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="font-semibold text-sm">
                        {message.senderId === user?.id ? 'You' : message.senderName}
                      </span>
                      <span className="text-xs ml-2 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isSignedIn}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isSignedIn || !newMessage.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
