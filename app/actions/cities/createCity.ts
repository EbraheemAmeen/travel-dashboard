'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function createCity(data: any) {
    console.log("data",data)
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.post(`${process.env.API_URL}/cities`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 