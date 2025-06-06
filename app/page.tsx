'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import ExchangeRateDisplay from '@/components/ExchangeRateDisplay';

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  // Function to handle the start exchanging button click
  const handleStartExchange = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
    // If not signed in, the SignInButton will handle the sign-in flow
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Secure Currency Exchange Between Nigeria & India
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Pay.Qudmeet is the trusted middleman for students exchanging
                Naira ⇄ Rupees, eliminating scams and delays.
              </p>
              <div className="space-x-4">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm bg-white text-blue-700 hover:bg-blue-50"
                  >
                    Start Exchanging
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <SignInButton mode="modal">
                    <button
                      onClick={handleStartExchange}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm bg-white text-blue-700 hover:bg-blue-50"
                    >
                      Start Exchanging
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </SignInButton>
                )}
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-6 py-3 border border-blue-300 text-base font-medium rounded-md text-white hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <button
                      className="inline-flex items-center px-6 py-3 border border-blue-300 text-base font-medium rounded-md text-white hover:bg-blue-700"
                    >
                      Sign Up Now
                    </button>
                  </SignUpButton>
                )}
              </div>
            </div>
            <div className="md:w-2/5">
              <ExchangeRateDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Our simple process makes currency exchange safe and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Start an Exchange</h3>
              <p className="text-gray-600 text-center">
                Enter the amount you want to exchange and see the exact amount you'll receive.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Make Your Payment</h3>
              <p className="text-gray-600 text-center">
                Send your payment to our secure account and upload proof of payment.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-3">Receive Your Exchange</h3>
              <p className="text-gray-600 text-center">
                Once verified, we'll send the exchanged amount to your account within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
