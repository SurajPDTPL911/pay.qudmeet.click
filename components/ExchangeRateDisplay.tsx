'use client';

import { useState, useEffect } from 'react';

type ExchangeRate = {
  rate: number;
  updatedAt: string;
};

export default function ExchangeRateDisplay() {
  const [nairaToRupeeRate, setNairaToRupeeRate] = useState<ExchangeRate | null>(null);
  const [rupeeToNairaRate, setRupeeToNairaRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        setLoading(true);
        
        // Fetch NGN to INR rate
        const ngnToInrResponse = await fetch('/api/exchange-rate?from=NGN&to=INR');
        if (!ngnToInrResponse.ok) {
          throw new Error('Failed to fetch NGN to INR rate');
        }
        const ngnToInrData = await ngnToInrResponse.json();

        setNairaToRupeeRate({
          rate: ngnToInrData.rate,
          updatedAt: new Date().toISOString(),
        });

        // Fetch INR to NGN rate
        const inrToNgnResponse = await fetch('/api/exchange-rate?from=INR&to=NGN');
        if (!inrToNgnResponse.ok) {
          throw new Error('Failed to fetch INR to NGN rate');
        }
        const inrToNgnData = await inrToNgnResponse.json();

        setRupeeToNairaRate({
          rate: inrToNgnData.rate,
          updatedAt: new Date().toISOString(),
        });
        
        setError(null);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        setError('Failed to fetch exchange rates');
      } finally {
        setLoading(false);
      }
    }

    fetchRates();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur p-6 rounded-lg shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-green-400 text-white px-3 py-1 rounded-full text-sm font-medium">
          Live Rate
        </div>
        {!loading && nairaToRupeeRate && (
          <div className="text-sm">
            Updated {formatDate(nairaToRupeeRate.updatedAt)}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-200">
          {error}. Using default rates.
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-md">
              <div>1 NGN</div>
              <div>=</div>
              <div className="font-bold">0.34 INR</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-md">
              <div>1 INR</div>
              <div>=</div>
              <div className="font-bold">2.94 NGN</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-md">
            <div>1 NGN</div>
            <div>=</div>
            <div className="font-bold">
              {nairaToRupeeRate ? nairaToRupeeRate.rate.toFixed(2) : '0.34'} INR
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/10 rounded-md">
            <div>1 INR</div>
            <div>=</div>
            <div className="font-bold">
              {rupeeToNairaRate ? rupeeToNairaRate.rate.toFixed(2) : '2.94'} NGN
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-center text-sm">
        Just 50 Rs flat fee per transaction
      </div>
    </div>
  );
}
