// app/dashboard/profile/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // In Next.js 15, auth() returns a Promise
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={`${user.firstName}'s profile`}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-500">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{user.emailAddresses[0]?.emailAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Created</p>
              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Manage Your Account</h3>
        <p className="mb-4">
          You can manage your account settings, including password and authentication methods, through Clerk.
        </p>
        <a
          href="https://accounts.clerk.dev/user"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Manage Account Settings
        </a>
      </div>
    </div>
  );
}