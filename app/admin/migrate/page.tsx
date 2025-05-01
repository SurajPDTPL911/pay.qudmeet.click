'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [secretKey, setSecretKey] = useState('');

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch(`/api/admin/migrate?key=${secretKey}`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResult({ success: true, message: data.message || 'Migration completed successfully!' });
      } else {
        setResult({ success: false, message: data.error || 'Migration failed. Please try again.' });
      }
    } catch (error) {
      console.error('Error running migration:', error);
      setResult({ success: false, message: 'An error occurred while running the migration.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Database Migration</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This page will run the database migration to create all the necessary tables for the application.
            This should only be run once when setting up the application for the first time.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Running this migration will create all the tables in the database. 
                  If the tables already exist, this will not overwrite them.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secret Key (Optional for admins)
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter migration secret key"
          />
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={runMigration}
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Running Migration...' : 'Run Migration'}
          </button>
          
          <Link
            href="/admin/dashboard"
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
