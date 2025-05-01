// app/dashboard/page.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await fetch('/api/transaction');
      const data = await res.json();
      setTransactions(data);
    };

    fetchTransactions();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.firstName}</h1>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Your Transactions</h2>
        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx: any) => (
              <li
                key={tx.id}
                className="border p-4 rounded shadow-sm flex justify-between items-center"
              >
                <span>
                  Sent {tx.amountSent} {tx.fromCurrency} → {tx.amountReceived}{' '}
                  {tx.toCurrency}
                </span>
                <span className="text-sm text-gray-500">{tx.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
