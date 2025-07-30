// types/auth.ts
export interface User {
  id: string
  name: string
  username: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  roleId: number
  wallets: {
    balance: string
    currency: string
  }
  avatar: string
  role: string
  permissions: string[]
}

export interface LoginResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}
