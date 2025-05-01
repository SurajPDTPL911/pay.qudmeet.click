'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Transaction = {
  id: number;
  senderId: string;
  amountSent: string;
  amountReceived: string;
  fromCurrency: string;
  toCurrency: string;
  status: string;
  receiptUrl: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/transactions')
      .then((res) => res.json())
      .then(setTxs);
  }, []);

  const updateStatus = async (id: number, status: 'completed' | 'failed') => {
    await fetch(`/api/admin/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    // Refresh
    setTxs((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Sender</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Receipt</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr key={tx.id}>
              <td className="border px-2 py-1">{tx.id}</td>
              <td className="border px-2 py-1">{tx.senderId}</td>
              <td className="border px-2 py-1">
                {tx.amountSent} {tx.fromCurrency} → {tx.amountReceived}{' '}
                {tx.toCurrency}
              </td>
              <td className="border px-2 py-1">
                <a
                  href={tx.receiptUrl}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  View
                </a>
              </td>
              <td className="border px-2 py-1">{tx.status}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => updateStatus(tx.id, 'completed')}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(tx.id, 'failed')}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
