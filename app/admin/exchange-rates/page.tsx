'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ExchangeRate = {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  updatedAt: string;
};

export default function AdminExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newRate, setNewRate] = useState({
    fromCurrency: 'NGN',
    toCurrency: 'INR',
    rate: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated and fetch exchange rates
    const checkAuthAndFetchRates = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/exchange-rates');
        
        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.push('/admin/login');
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        
        const data = await res.json();
        setRates(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Failed to load exchange rates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchRates();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRate((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRate.rate || parseFloat(newRate.rate) <= 0) {
      alert('Please enter a valid rate');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/exchange-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRate),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update exchange rate');
      }
      
      // Refresh rates
      const updatedRatesRes = await fetch('/api/admin/exchange-rates');
      const updatedRates = await updatedRatesRes.json();
      setRates(updatedRates);
      
      // Reset form
      setNewRate({
        fromCurrency: 'NGN',
        toCurrency: 'INR',
        rate: '',
      });
      
      alert('Exchange rate updated successfully');
    } catch (err) {
      console.error('Error updating exchange rate:', err);
      alert('Failed to update exchange rate. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Exchange Rate Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Exchange Rate Management</h1>
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
        <h1 className="text-2xl font-bold">Exchange Rate Management</h1>
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
        {/* Add/Update Exchange Rate Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Update Exchange Rate</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Currency</label>
                <select
                  name="fromCurrency"
                  value={newRate.fromCurrency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Currency</label>
                <select
                  name="toCurrency"
                  value={newRate.toCurrency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate</label>
              <input
                type="number"
                name="rate"
                value={newRate.rate}
                onChange={handleInputChange}
                placeholder="Enter rate"
                step="0.0001"
                min="0.0001"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                1 {newRate.fromCurrency} = ? {newRate.toCurrency}
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Rate
            </button>
          </form>
        </div>
        
        {/* Current Exchange Rates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Exchange Rates</h2>
          {rates.length === 0 ? (
            <p className="text-gray-500 text-center">No exchange rates found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rates.map((rate) => (
                    <tr key={rate.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{rate.fromCurrency}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{rate.toCurrency}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{parseFloat(rate.rate).toFixed(4)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rate.updatedAt).toLocaleString()}
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
