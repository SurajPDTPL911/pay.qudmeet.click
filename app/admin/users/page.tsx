'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: number;
  clerkId: string;
  name: string | null;
  email: string;
  country: string;
  currency: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated and fetch users
    const checkAuthAndFetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/users');
        
        if (res.status === 401) {
          // Not authenticated, redirect to login
          router.push('/admin/login');
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await res.json();
        setUsers(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndFetchUsers();
  }, [router]);

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update user status');
      }
      
      // Update user in the UI
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, isActive: !isActive } : user))
      );
      
      alert(`User status updated successfully`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
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
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="space-x-4">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.country}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.currency}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        className={`px-2 py-1 text-xs rounded ${
                          user.isActive 
                            ? 'bg-red-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                      >
                        View Details
                      </Link>
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
