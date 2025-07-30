// app/login/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '../actions/login' // Your Server Action
import { useAuthStore } from '@/store/useAuthStore' // Your Zustand store
import { toast} from 'react-hot-toast'
import { LogIn, Loader2, EyeClosed, EyeIcon } from 'lucide-react'

// Define the structure of the API response for the login function
interface LoginResponse {
  user: {
    id: string
    name: string
    username: string
    email: string
    avatar: string
    role: string
    permissions: string[]
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [emailOrUsername, setEmailOrUsername] = useState('jossef@gmail.com')
  const [password, setPassword] = useState('jossefk1234')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const [isPending, startTransition] = useTransition()
  const login = useAuthStore((state) => state.login) // Get the login action from the store

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        // 1. Call the server action
        const data: LoginResponse = await loginAdmin(emailOrUsername, password)

        login(data)

        toast.success('Login successful! Redirecting...')
        router.push('/') // 3. Redirect to the dashboard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const errorMessage =
          err.message || 'Login failed. Please check your credentials.'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    })
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
        <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-400">
                Email or Username
              </label>
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
              <label className="block mb-1 text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="w-full flex relative">
                <input
                  type={visible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                  required
                />
                <div
                  onClick={() => setVisible(!visible)}
                  className=" absolute right-2 cursor-pointer top-1/2 -translate-y-1/2"
                >
                  {visible ? <EyeIcon /> : <EyeClosed />}
                </div>
              </div>
            </div>
            {error && (
              <p className="mb-4 text-red-500 text-center font-semibold">
                {error}
              </p>
            )}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-3 rounded-md font-semibold disabled:bg-indigo-500 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                {isPending ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
