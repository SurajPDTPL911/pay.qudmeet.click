'use client';

import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={`${inter.className} min-h-screen bg-white`}>
      {/* Admin Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Pay.Qudmeet</span>
              </Link>
              <nav className="ml-10 flex space-x-4">
                <Link
                  href="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/dashboard'
                      ? 'bg-blue-800 text-white'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/users'
                      ? 'bg-blue-800 text-white'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Users
                </Link>
                <Link
                  href="/admin/exchange-rates"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/exchange-rates'
                      ? 'bg-blue-800 text-white'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Exchange Rates
                </Link>
                <Link
                  href="/admin/payment-accounts"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/payment-accounts'
                      ? 'bg-blue-800 text-white'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Payment Accounts
                </Link>
                <Link
                  href="/admin/migrate"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/admin/migrate'
                      ? 'bg-blue-800 text-white'
                      : 'text-white hover:bg-blue-600'
                  }`}
                >
                  Database Setup
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-600"
              >
                Main Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
