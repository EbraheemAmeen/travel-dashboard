'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function createUser(data: any) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.post(`${process.env.API_URL}/users`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 