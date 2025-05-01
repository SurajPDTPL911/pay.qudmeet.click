'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-lg text-gray-600 mb-8">
        We apologize for the inconvenience. Please try again later.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
