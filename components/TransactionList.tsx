'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  id: number;
  transactionId: string;
  amountSent: string;
  amountReceived: string;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  createdAt: string;
}

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch('/api/transaction');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load your transactions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTransactions();
  }, []);
  
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          {error}
        </div>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-500 mb-4">
            You haven't made any currency exchanges yet.
          </p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Start an Exchange
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Your Exchanges</h2>
      
      <div className="space-y-3">
        {transactions.map((tx) => (
          <Link
            key={tx.transactionId}
            href={`/dashboard/transaction/${tx.transactionId}`}
            className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm">
                  {tx.fromCurrency} → {tx.toCurrency}
                </span>
                <div className="font-medium">
                  {parseFloat(tx.amountSent).toFixed(2)} {tx.fromCurrency} ⟶ {' '}
                  {parseFloat(tx.amountReceived).toFixed(2)} {tx.toCurrency}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(tx.status)}`}>
                  {formatStatus(tx.status)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 