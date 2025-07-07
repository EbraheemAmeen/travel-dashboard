'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const accessToken = (await cookies()).get('accessToken')?.value;
    
  if (accessToken) {
    try {
      await axios.post(
        `${process.env.API_URL}/auth/logout`,
        {}, // body
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (error) {
      console.log('Error calling backend logout:', error);
      // Optional: you can decide whether to continue or halt
    }
  }

  // Delete cookie(s)
  (await
    // Delete cookie(s)
    cookies()).delete('accessToken');
  // If you store refreshToken too:
  // cookies().delete('refreshToken');

  // Redirect to login page
  redirect('/login');
}