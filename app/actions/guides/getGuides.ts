'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface GetGuidesParams {
  cityId?: number;
  orderDir?: 'asc' | 'desc';
  orderBy?: 'createdAt' | 'name';
  page?: number;
  limit?: number;
}

export async function getGuides(params: GetGuidesParams = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const queryParams = new URLSearchParams();

  if (params.cityId) queryParams.append('cityId', params.cityId.toString());
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await axios.get(`${process.env.API_URL}/guides?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  });

  return response.data;
} 