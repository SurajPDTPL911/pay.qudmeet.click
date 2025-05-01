'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { User } from 'lucide-react';

export default function ProfileForm() {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      country: '',
      currency: '',
      schoolName: '',
      phoneNumber: '',
    }
  });

  async function onSubmit(data: any) {
    setIsLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Update profile information in our database
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }
  
  if (!isLoaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center mb-6">
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.fullName || 'User'}
            className="w-16 h-16 rounded-full mr-4 object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full mr-4 flex items-center justify-center">
            <User className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{user?.fullName}</h2>
          <p className="text-gray-500">{user?.emailAddresses[0]?.emailAddress}</p>
        </div>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
          Profile updated successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              {...register('country', { required: 'Country is required' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your country</option>
              <option value="Nigeria">Nigeria</option>
              <option value="India">India</option>
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-500">
                {errors.country.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              {...register('currency', { required: 'Currency is required' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your currency</option>
              <option value="NGN">Nigerian Naira (NGN)</option>
              <option value="INR">Indian Rupee (INR)</option>
            </select>
            {errors.currency && (
              <p className="mt-1 text-sm text-red-500">
                {errors.currency.message}
              </p>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            School Name (Optional)
          </label>
          <input
            type="text"
            {...register('schoolName')}
            placeholder="Enter your school name"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            {...register('phoneNumber', { 
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: 'Please enter a valid phone number'
              }
            })}
            placeholder="Enter your phone number"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-500">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
} 