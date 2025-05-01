'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowDown, ArrowUp, UploadCloud } from 'lucide-react';

interface ExchangeRate {
  rate: number;
  updatedAt: string;
}

interface TransactionFormProps {
  onSuccess?: (transaction: any) => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nairaToRupeeRate, setNairaToRupeeRate] = useState<ExchangeRate | null>(null);
  const [rupeeToNairaRate, setRupeeToNairaRate] = useState<ExchangeRate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      amount: '',
      type: 'naira-to-rupees', // Default to Naira to Rupees
    }
  });
  
  const watchType = watch('type');
  const watchAmount = watch('amount');
  
  // Fetch exchange rates when component mounts
  useEffect(() => {
    async function fetchRates() {
      try {
        // Fetch NGN to INR rate
        const ngnToInrResponse = await fetch('/api/exchange-rate?from=NGN&to=INR');
        const ngnToInrData = await ngnToInrResponse.json();
        
        setNairaToRupeeRate({
          rate: ngnToInrData.rate,
          updatedAt: new Date().toISOString(),
        });
        
        // Fetch INR to NGN rate
        const inrToNgnResponse = await fetch('/api/exchange-rate?from=INR&to=NGN');
        const inrToNgnData = await inrToNgnResponse.json();
        
        setRupeeToNairaRate({
          rate: inrToNgnData.rate,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        setError('Failed to fetch exchange rates. Please try again later.');
      }
    }
    
    fetchRates();
  }, []);
  
  // Calculate the amount to receive based on current input
  function calculateAmountToReceive(): number | null {
    if (!watchAmount) return null;
    
    const amount = parseFloat(watchAmount);
    if (isNaN(amount)) return null;
    
    const fee = 50; // 50 Rs flat fee
    
    if (watchType === 'naira-to-rupees' && nairaToRupeeRate) {
      // Convert Naira to Rupees and subtract fee
      const convertedAmount = amount * nairaToRupeeRate.rate;
      return Math.max(0, convertedAmount - fee);
    } else if (watchType === 'rupees-to-naira' && rupeeToNairaRate) {
      // Convert Rupees to Naira and subtract fee (in naira)
      const convertedAmount = amount * rupeeToNairaRate.rate;
      const feeInNaira = fee / rupeeToNairaRate.rate;
      return Math.max(0, convertedAmount - feeInNaira);
    }
    
    return null;
  }
  
  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }
  
  // Form submission
  async function onSubmit(data: any) {
    setError(null);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('type', data.type);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const response = await fetch('/api/transaction', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }
      
      const result = await response.json();
      
      // Reset form
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result.transaction);
      }
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      setError(error.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Start Currency Exchange</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exchange Type
          </label>
          <div className="flex space-x-3">
            <label className={`flex-1 p-3 border rounded-md cursor-pointer ${
              watchType === 'naira-to-rupees' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                value="naira-to-rupees"
                className="sr-only"
                {...register('type')}
              />
              <div className="flex items-center justify-center space-x-2">
                <div>NGN</div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div>INR</div>
              </div>
            </label>
            <label className={`flex-1 p-3 border rounded-md cursor-pointer ${
              watchType === 'rupees-to-naira' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                value="rupees-to-naira"
                className="sr-only"
                {...register('type')}
              />
              <div className="flex items-center justify-center space-x-2">
                <div>INR</div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div>NGN</div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount to Send
          </label>
          <div className="relative">
            <input
              type="number"
              className="block w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter amount in ${watchType === 'naira-to-rupees' ? 'Naira' : 'Rupees'}`}
              {...register('amount', { required: true, min: 1 })}
            />
            <div className="absolute right-3 top-3 text-gray-400">
              {watchType === 'naira-to-rupees' ? 'NGN' : 'INR'}
            </div>
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-500">
              Please enter a valid amount
            </p>
          )}
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-500">Current Rate:</span>
            <span className="font-medium">
              {watchType === 'naira-to-rupees' 
                ? nairaToRupeeRate 
                  ? `1 NGN = ${nairaToRupeeRate.rate.toFixed(2)} INR` 
                  : 'Loading...'
                : rupeeToNairaRate 
                  ? `1 INR = ${rupeeToNairaRate.rate.toFixed(2)} NGN` 
                  : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-500">Fee:</span>
            <span className="font-medium">
              50 Rs flat fee
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">You'll Receive:</span>
              <span className="font-bold text-lg">
                {calculateAmountToReceive() !== null
                  ? `${calculateAmountToReceive()?.toFixed(2)} ${watchType === 'naira-to-rupees' ? 'INR' : 'NGN'}`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Payment Screenshot (Optional)
          </label>
          <div className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => document.getElementById('file-upload')?.click()}>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
            <div className="space-y-2">
              <UploadCloud className="h-8 w-8 mx-auto text-gray-400" />
              <div className="text-sm text-gray-500">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </div>
            </div>
          </div>
          
          {previewUrl && (
            <div className="mt-3">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="h-40 object-contain mx-auto border rounded-md"
              />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Start Exchange'}
        </button>
      </form>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
); 