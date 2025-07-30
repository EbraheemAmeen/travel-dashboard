import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  name: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  permissions: Set<string>
  _hasHydrated: boolean // ✅ 1. Add a state to track hydration
  login: (userData: {
    user: User
    tokens: { accessToken: string; refreshToken: string }
  }) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      permissions: new Set(),
      _hasHydrated: false, // ✅ 2. Set initial value

      login: (userData) => {
        set({
          user: userData.user,
          isAuthenticated: true,
          permissions: new Set(userData.user.permissions),
        })
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          permissions: new Set(),
        })
      },
      hasPermission: (permission) => get().permissions.has(permission),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if (value instanceof Set) {
            return Array.from(value)
          }
          return value
        },
        reviver: (key, value) => {
          if (key === 'permissions' && Array.isArray(value)) {
            return new Set(value)
          }
          return value
        },
      }),
      // ✅ 3. Use the onRehydrate callback here
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true
        }
      },
    }
  )
)
