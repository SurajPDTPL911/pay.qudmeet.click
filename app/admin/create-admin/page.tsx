'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const createAdmin = async (useSql = false) => {
    setLoading(true);
    setResult(null);

    try {
      const endpoint = useSql ? '/api/admin/create-admin-sql' : '/api/admin/create-admin';
      const res = await fetch(endpoint, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.message || 'Admin user created successfully!'
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create admin user. Please try again.' +
            (data.message ? ` Error: ${data.message}` : '')
        });
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      setResult({
        success: false,
        message: 'An error occurred while creating the admin user.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Admin User</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This page will create an admin user using the credentials from your environment variables:
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Email:</strong> {process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@qudmeet.click'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Password:</strong> (From your .env.local file)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Make sure you have run the database migration before creating the admin user.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => createAdmin(false)}
              disabled={loading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Creating...' : 'Create Admin (ORM)'}
            </button>

            <button
              onClick={() => createAdmin(true)}
              disabled={loading}
              className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {loading ? 'Creating...' : 'Create Admin (SQL)'}
            </button>
          </div>

          <div className="flex space-x-4">
            <Link
              href="/admin/login"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Back to Login
            </Link>

            <Link
              href="/admin/migrate"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Run Migration
            </Link>
          </div>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <p className="text-sm font-medium">{result.success ? 'Success!' : 'Error:'}</p>
            <p className="text-sm mt-1">{result.message}</p>
            {result.success && (
              <p className="text-sm mt-2">
                You can now <Link href="/admin/login" className="font-medium underline">login</Link> with your admin credentials.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
