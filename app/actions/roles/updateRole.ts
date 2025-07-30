'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export async function updateRole(id: number, data: { name: string; description: string; permissionIds: number[] }) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.patch(`${process.env.API_URL}/roles/${id}`, data, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
} 