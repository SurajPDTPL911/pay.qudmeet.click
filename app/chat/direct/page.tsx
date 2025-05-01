'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: number;
  clerkId: string;
  name: string;
  email: string;
  country: string;
  currency: string;
  profilePicture: string | null;
};

type Conversation = {
  id: number;
  otherUser: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  lastMessage: {
    content: string;
    isFromMe: boolean;
    createdAt: string;
  } | null;
};

export default function DirectChatPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Redirect to login if not signed in
    if (!isSignedIn && !loading) {
      router.push('/sign-in');
    }
  }, [isSignedIn, router, loading]);

  useEffect(() => {
    // Fetch users and conversations
    const fetchData = async () => {
      try {
        // Fetch conversations
        const conversationsRes = await fetch('/api/chat/direct');
        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json();
          setConversations(conversationsData);
        }

        // Fetch users
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchData();
    }
  }, [isSignedIn]);

  const startChat = (userId: string) => {
    router.push(`/chat/direct/${userId}`);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSignedIn && !loading) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
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
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Conversations */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Conversations</h2>
          </div>
          
          <div className="h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet. Start a chat with someone!
              </div>
            ) : (
              <div>
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => startChat(conversation.otherUser.id)}
                  >
                    <div className="flex items-center">
                      {conversation.otherUser.profilePicture ? (
                        <img 
                          src={conversation.otherUser.profilePicture} 
                          alt={conversation.otherUser.name}
                          className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {conversation.otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conversation.otherUser.name}</p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage.isFromMe ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - User list */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold mb-2">Start a New Conversation</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No other users available.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => startChat(user.clerkId)}
                  >
                    <div className="flex items-center">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.name}
                          className="w-12 h-12 rounded-full mr-3 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.country} • {user.currency}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
