// actions/login.ts
'use server'

import axios from 'axios'
import { cookies } from 'next/headers'
import { LoginResponse } from '@/types/auth' // Adjust path as needed

export async function loginAdmin(
  emailOrUsername: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${process.env.API_URL}/auth/admin-login`,
      { emailOrUsername, password }
    )
    ;(await cookies()).set('accessToken', response.data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    // Optionally, set refreshToken as well if you need it for re-authentication
    // cookies().set('refreshToken', response.data.tokens.refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   maxAge: 7 * 24 * 60 * 60, // 7 days
    //   path: '/',
    // });

    return response.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error('Login failed')
  }
}
