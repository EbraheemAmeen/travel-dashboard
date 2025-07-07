'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '../actions/login';

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        const data = await loginAdmin(emailOrUsername, password);
        console.log('Login success:', data);
        router.push('/home');
      } catch (err: any) {
        setError(err.message || 'Login failed');
      }
    });
  };

  const handleClear = () => {
    setEmailOrUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Email or Username</label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className="mb-4 text-red-500 text-center font-semibold">{error}</p>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-600 hover:bg-gray-700 transition-colors px-6 py-2 rounded-md font-semibold"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-2 rounded-md font-semibold"
            >
              {isPending ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}