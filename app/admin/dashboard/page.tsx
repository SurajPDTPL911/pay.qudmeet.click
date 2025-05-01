'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Transaction = {
  id: number;
  transactionId: string;
  senderId: string;
  amountSent: string;
  amountReceived: string;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  receiptUrl: string | null;
  createdAt: string;
};

export default function AdminDashboard() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/transactions');

        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data = await res.json();
        setTxs(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update transaction status');
      }

      // Refresh the transaction in the UI
      setTxs((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
      );

      // Show success message (you could add a toast notification here)
      alert(`Transaction status updated to ${status}`);
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Failed to update transaction status. Please try again.');
    }
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/logout', {
        method: 'POST',
      });

      if (res.ok) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
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
  };

  // State for payment account assignment
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<number | null>(null);
  const [assigningPaymentAccount, setAssigningPaymentAccount] = useState(false);
  const [transactionForPaymentAccount, setTransactionForPaymentAccount] = useState<string | null>(null);

  // Fetch payment accounts
  useEffect(() => {
    if (isAuthenticated) {
      const fetchPaymentAccounts = async () => {
        try {
          const res = await fetch('/api/admin/payment-accounts');
          if (res.ok) {
            const data = await res.json();
            setPaymentAccounts(data);
          }
        } catch (err) {
          console.error('Error fetching payment accounts:', err);
        }
      };

      fetchPaymentAccounts();
    }
  }, [isAuthenticated]);

  // Function to assign payment account to transaction
  const assignPaymentAccount = async (transactionId: string) => {
    if (!selectedPaymentAccount) {
      alert('Please select a payment account');
      return;
    }

    setAssigningPaymentAccount(true);

    try {
      const res = await fetch('/api/admin/transactions/assign-payment-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          paymentAccountId: selectedPaymentAccount,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to assign payment account');
      }

      alert('Payment account assigned successfully');
      setTransactionForPaymentAccount(null);
      setSelectedPaymentAccount(null);
    } catch (err) {
      console.error('Error assigning payment account:', err);
      alert('Failed to assign payment account. Please try again.');
    } finally {
      setAssigningPaymentAccount(false);
    }
  };

  // Function to get available actions based on current status
  const getAvailableActions = (tx: Transaction) => {
    switch (tx.status) {
      case 'awaiting_payment':
        return (
          <>
            <button
              onClick={() => setTransactionForPaymentAccount(tx.transactionId)}
              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs mb-1"
            >
              Assign Payment Account
            </button>
            <button
              onClick={() => updateStatus(tx.id, 'payment_received')}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Mark Payment Received
            </button>
          </>
        );
      case 'payment_received':
        return (
          <>
            <button
              onClick={() => updateStatus(tx.id, 'transfer_in_progress')}
              className="px-2 py-1 bg-purple-500 text-white rounded text-xs"
            >
              Start Transfer
            </button>
            <button
              onClick={() => updateStatus(tx.id, 'failed')}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs mt-1"
            >
              Mark Failed
            </button>
          </>
        );
      case 'transfer_in_progress':
        return (
          <>
            <button
              onClick={() => updateStatus(tx.id, 'completed')}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              Complete
            </button>
            <button
              onClick={() => updateStatus(tx.id, 'failed')}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs mt-1"
            >
              Mark Failed
            </button>
          </>
        );
      case 'completed':
      case 'failed':
        return (
          <span className="text-xs text-gray-500">No actions available</span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            User Management
          </Link>
          <Link
            href="/admin/exchange-rates"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exchange Rates
          </Link>
          <Link
            href="/admin/payment-accounts"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Payment Accounts
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Transactions</h2>
          <p className="text-3xl font-bold text-blue-600">{txs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Pending Transactions</h2>
          <p className="text-3xl font-bold text-yellow-600">
            {txs.filter(tx => tx.status === 'awaiting_payment' || tx.status === 'payment_received').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Completed Transactions</h2>
          <p className="text-3xl font-bold text-green-600">
            {txs.filter(tx => tx.status === 'completed').length}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Transaction Management</h2>

      {/* Payment Account Assignment Modal */}
      {transactionForPaymentAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assign Payment Account</h3>
            <p className="mb-4 text-sm text-gray-600">
              Select a payment account to assign to transaction {transactionForPaymentAccount}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Account
              </label>
              <select
                value={selectedPaymentAccount || ''}
                onChange={(e) => setSelectedPaymentAccount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a payment account</option>
                {paymentAccounts
                  .filter(account => account.isActive)
                  .map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} - {account.accountNumber} ({account.currency})
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setTransactionForPaymentAccount(null);
                  setSelectedPaymentAccount(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => assignPaymentAccount(transactionForPaymentAccount)}
                disabled={assigningPaymentAccount || !selectedPaymentAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assigningPaymentAccount ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {txs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">No transactions found.</p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm text-blue-700">
            <p className="font-bold">Getting Started</p>
            <p className="mt-1">
              If you're seeing database errors, please run the database migration first by clicking on the "Database Setup" link in the navigation bar.
            </p>
            <p className="mt-2">
              After running the migration, you can log in with the default admin credentials:
            </p>
            <ul className="list-disc list-inside mt-1">
              <li>Username: admin</li>
              <li>Password: admin123</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {txs.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{tx.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{tx.transactionId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{tx.senderId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {tx.amountSent} {tx.fromCurrency} → {tx.amountReceived}{' '}
                    {tx.toCurrency}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {tx.receiverName ? (
                      <div>
                        <div>{tx.receiverName}</div>
                        <div className="text-xs text-gray-500">{tx.receiverBankName}</div>
                        <div className="text-xs text-gray-500">{tx.receiverAccountNumber}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                      {tx.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col space-y-1">
                      {getAvailableActions(tx)}
                      {tx.receiptUrl && (
                        <a
                          href={tx.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
                        >
                          View Receipt
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
