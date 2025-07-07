'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

interface LoginResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export async function loginAdmin(emailOrUsername: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${process.env.API_URL}/auth/admin-login`,
      { emailOrUsername, password }
    );

     (await cookies()).set('accessToken', response.data.tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

    return response.data;
  } catch (error: any) {
    // Optional: customize error handling based on axios error structure
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Login failed');
  }
}


