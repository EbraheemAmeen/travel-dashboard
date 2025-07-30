'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function getRoleById(id: number) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.get(`${process.env.API_URL}/roles/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 