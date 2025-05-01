'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PaymentAccount = {
  id: number;
  accountType: string;
  currency: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountType: 'bank',
    currency: 'NGN',
    accountName: '',
    accountNumber: '',
    bankName: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated and fetch payment accounts
    const checkAuthAndFetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/payment-accounts');
        
        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.push('/admin/login');
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch payment accounts');
        }
        
        const data = await res.json();
        setAccounts(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error fetching payment accounts:', err);
        setError('Failed to load payment accounts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchAccounts();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccount.accountName || !newAccount.accountNumber) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/payment-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add payment account');
      }
      
      // Refresh accounts
      const updatedAccountsRes = await fetch('/api/admin/payment-accounts');
      const updatedAccounts = await updatedAccountsRes.json();
      setAccounts(updatedAccounts);
      
      // Reset form
      setNewAccount({
        accountType: 'bank',
        currency: 'NGN',
        accountName: '',
        accountNumber: '',
        bankName: '',
      });
      
      alert('Payment account added successfully');
    } catch (err) {
      console.error('Error adding payment account:', err);
      alert('Failed to add payment account. Please try again.');
    }
  };

  const toggleAccountStatus = async (accountId: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/payment-accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update account status');
      }
      
      // Update account in the UI
      setAccounts((prev) =>
        prev.map((account) => (account.id === accountId ? { ...account, isActive: !isActive } : account))
      );
      
      alert(`Account status updated successfully`);
    } catch (err) {
      console.error('Error updating account status:', err);
      alert('Failed to update account status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Payment Account Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Payment Account Management</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login page
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Account Management</h1>
        <div className="space-x-4">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Payment Account Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Add Payment Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  name="accountType"
                  value={newAccount.accountType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bank">Bank Account</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={newAccount.currency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
              <input
                type="text"
                name="accountName"
                value={newAccount.accountName}
                onChange={handleInputChange}
                placeholder="Enter account holder name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={newAccount.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter account number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={newAccount.bankName}
                onChange={handleInputChange}
                placeholder="Enter bank name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Account
            </button>
          </form>
        </div>
        
        {/* Current Payment Accounts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Payment Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-center">No payment accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.currency}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.accountName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{account.accountNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => toggleAccountStatus(account.id, account.isActive)}
                          className={`px-2 py-1 text-xs rounded ${
                            account.isActive 
                              ? 'bg-red-500 text-white' 
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {account.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
