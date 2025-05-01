'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Upload, Download, MessageSquare } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';

interface Transaction {
  id: number;
  transactionId: string;
  senderId: string;
  receiverId: string;
  amountSent: string;
  amountReceived: string;
  fee: string;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  receiptUrl?: string;
  paymentScreenshotUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const response = await fetch(`/api/transaction?id=${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction');
        }
        
        const data = await response.json();
        setTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setError('Failed to load transaction details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchTransaction();
    }
  }, [id]);
  
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_received':
        return 'bg-blue-100 text-blue-800';
      case 'transfer_in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  function formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-4 bg-red-50 text-red-500 rounded-md">
            {error || 'Transaction not found'}
          </div>
          <div className="mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Transaction Details</h1>
            <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusBadgeClass(transaction.status)}`}>
              {formatStatus(transaction.status)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ID: {transaction.transactionId}
          </p>
        </div>
        
        {/* Transaction Details */}
        <div className="p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">From</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-lg font-semibold">
                  {parseFloat(transaction.amountSent).toFixed(2)} {transaction.fromCurrency}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {transaction.createdAt 
                    ? format(new Date(transaction.createdAt), 'MMMM d, yyyy')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">To</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-lg font-semibold">
                  {parseFloat(transaction.amountReceived).toFixed(2)} {transaction.toCurrency}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {transaction.completedAt 
                    ? format(new Date(transaction.completedAt), 'MMMM d, yyyy')
                    : 'Pending'
                  }
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Fee</h2>
              <div className="text-lg">
                {parseFloat(transaction.fee).toFixed(2)} {transaction.fee.includes('INR') ? 'INR' : 'Rs'}
              </div>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Date</h2>
              <div className="text-lg">
                {transaction.createdAt 
                  ? format(new Date(transaction.createdAt), 'MMMM d, yyyy h:mm a')
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-4">
            {transaction.status === 'awaiting_payment' && (
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Payment Proof
              </button>
            )}
            
            {transaction.receiptUrl && (
              <a 
                href={transaction.receiptUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </a>
            )}
            
            <button 
              onClick={() => setShowChat(!showChat)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>
        </div>
        
        {/* Chat */}
        {showChat && (
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Transaction Chat</h2>
            <ChatInterface transactionId={transaction.transactionId} />
          </div>
        )}
        
        {/* Payment Screenshot */}
        {transaction.paymentScreenshotUrl && (
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Screenshot</h2>
            <div className="mt-2">
              <a 
                href={transaction.paymentScreenshotUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block max-w-md mx-auto"
              >
                <img 
                  src={transaction.paymentScreenshotUrl} 
                  alt="Payment Screenshot" 
                  className="border rounded-lg shadow-sm"
                />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 