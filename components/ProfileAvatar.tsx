'use client';

import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Camera, Check, X } from 'lucide-react';

export default function ProfileAvatar() {
  const { user, isLoaded } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded || !user) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update Clerk user image
      await user.setProfileImage({ file: fileInputRef.current.files[0] });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      
      // Reset form
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={`${user.fullName}'s profile`}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-2xl font-medium text-gray-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          )
        )}
        
        <label 
          htmlFor="avatar-upload" 
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Upload avatar</span>
        </label>
        
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
      
      {uploadSuccess && (
        <div className="mt-2 text-green-500 text-sm flex items-center">
          <Check className="h-4 w-4 mr-1" />
          Avatar updated successfully
        </div>
      )}
      
      {previewUrl && (
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
          >
            {isUploading ? 'Uploading...' : 'Save'}
          </button>
          <button
            onClick={cancelUpload}
            disabled={isUploading}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
