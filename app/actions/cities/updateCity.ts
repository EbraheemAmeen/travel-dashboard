'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function updateCity(id: number, data: any) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.patch(`${process.env.API_URL}/cities/${id}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 