'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, SendHorizontal } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your Pay.Qudmeet assistant. How can I help you with your currency exchange today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set loading
    setInput('');
    setIsLoading(true);
    
    try {
      // Call AI API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: data.answer }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again later or contact support if the issue persists.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }
  
  function toggleChat() {
    setIsOpen(!isOpen);
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 max-h-[500px]">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button 
              onClick={toggleChat}
              className="text-white hover:text-blue-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 rounded-bl-none'
                  }`}>
                    <div className="break-words">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2 max-w-[85%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t bg-white">
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Chat button */}
      <button
        onClick={toggleChat}
        className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
} 