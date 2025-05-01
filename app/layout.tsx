import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import AIChatAssistant from '@/components/AIChatAssistant';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Pay.Qudmeet - Secure Currency Exchange Platform',
  description: 'Securely exchange currencies between Nigeria and India with our trusted middleman service.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} min-h-screen bg-gray-50`}>
          <Navbar />
          <main>{children}</main>
          <AIChatAssistant />
        </body>
      </html>
    </ClerkProvider>
  );
}
