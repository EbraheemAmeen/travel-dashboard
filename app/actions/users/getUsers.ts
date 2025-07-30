'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

interface GetUsersParams {
  offset?: number;
  limit?: number;
  sortBy?: 'date' | 'name';
  order?: 'asc' | 'desc';
  roleId?: number;
}

export async function getUsers(params: GetUsersParams = {}) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.get(`${process.env.API_URL}/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });
  return response.data;
} 