'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SendHorizontal, ArrowLeft } from 'lucide-react';

type Message = {
  id: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type OtherUser = {
  id: string;
  name: string;
  profilePicture: string | null;
};

type ChatData = {
  conversationId: number;
  otherUser: OtherUser;
  messages: Message[];
};

export default function DirectChatPage({ params }: { params: { userId: string } }) {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserId = params.userId;

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
        const res = await fetch(`/api/chat/direct?userId=${otherUserId}`);
        if (res.ok) {
          const data = await res.json();
          setChatData(data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn && otherUserId) {
      fetchMessages();
      
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn, otherUserId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isSignedIn || !otherUserId) return;
    
    try {
      const res = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          receiverId: otherUserId,
        }),
      });
      
      if (res.ok) {
        // Add message to UI immediately for better UX
        if (chatData) {
          const tempMessage: Message = {
            id: Date.now(),
            senderId: user?.id || '',
            content: newMessage,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          
          setChatData({
            ...chatData,
            messages: [...chatData.messages, tempMessage],
          });
        }
        
        setNewMessage('');
        
        // Fetch updated messages
        const updatedRes = await fetch(`/api/chat/direct?userId=${otherUserId}`);
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setChatData(data);
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
        <div className="flex items-center">
          <Link
            href="/chat/direct"
            className="mr-4 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          {chatData?.otherUser && (
            <div className="flex items-center">
              {chatData.otherUser.profilePicture ? (
                <img 
                  src={chatData.otherUser.profilePicture} 
                  alt={chatData.otherUser.name}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {chatData.otherUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <h1 className="text-xl font-bold">{chatData.otherUser.name}</h1>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <Link
            href="/chat/group"
            className="text-blue-600 hover:text-blue-800"
          >
            Group Chat
          </Link>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800"
          >
            Dashboard
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : !chatData || chatData.messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {chatData.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.senderId !== user?.id && (
                    <div className="flex-shrink-0 mr-2">
                      {chatData.otherUser.profilePicture ? (
                        <img 
                          src={chatData.otherUser.profilePicture} 
                          alt={chatData.otherUser.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {chatData.otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                  {message.senderId === user?.id && (
                    <div className="flex-shrink-0 ml-2">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt={user.fullName || 'You'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user?.firstName?.charAt(0).toUpperCase() || 'Y'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
              <SendHorizontal className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
