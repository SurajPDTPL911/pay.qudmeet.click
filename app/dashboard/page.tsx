// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

export default async function DashboardPage() {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}</h1>
        <p className="text-gray-500">
          Safely exchange currencies between Nigeria and India with our trusted platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <TransactionForm />
        </div>

        <div className="lg:col-span-2">
          <TransactionList />
        </div>
      </div>
    </div>
  );
}
