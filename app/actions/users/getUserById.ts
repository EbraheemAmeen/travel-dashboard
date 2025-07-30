'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function getUserById(id: string) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.get(`${process.env.API_URL}/users/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 