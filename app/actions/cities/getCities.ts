'use server';
import axios from 'axios';
import { cookies } from 'next/headers';

export interface GetCitiesParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  countryId?: number;
  isActive?: boolean;
  search?: string;
}

export async function getCities(params: GetCitiesParams = {}) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) throw new Error('No access token found');
  const response = await axios.get(`${process.env.API_URL}/cities`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });
  return response.data;
} 