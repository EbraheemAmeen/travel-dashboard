'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  // ✅ Get the hydration status directly from the store
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Wait until the store has been rehydrated
    if (hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [hasHydrated, isAuthenticated, router])

  // While the store is rehydrating from localStorage, show a loader
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
        <p className="ml-4 text-white">Loading session...</p>
      </div>
    )
  }

  // If hydrated and still not authenticated, the useEffect will redirect.
  // You can return null to avoid a brief flash of content.
  if (!isAuthenticated) {
    return null
  }

  // If we reach here, hydration is complete and the user is authenticated.
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome Home, {user?.name}!</h1>
        <p className="text-lg text-gray-400">
          Your session was successfully loaded from storage.
        </p>
        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3">Your Permissions</h2>
          <pre className="text-sm bg-gray-900 p-4 rounded-md overflow-x-auto">
            <code>
              {JSON.stringify(Array.from(user?.permissions || []), null, 2)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}
