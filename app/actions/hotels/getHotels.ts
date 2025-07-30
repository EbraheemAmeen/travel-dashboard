'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface GetHotelsParams {
  cityId?: number;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'name' | 'stars' | 'avgRating';
  orderDir?: 'asc' | 'desc';
  search?: string;
  stars?: number;
  isActive?: boolean;
}

export async function getHotels(params: GetHotelsParams = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const queryParams = new URLSearchParams();

  if (params.cityId) queryParams.append('cityId', params.cityId.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  if (params.search) queryParams.append('search', params.search);
  if (params.stars) queryParams.append('stars', params.stars.toString());
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  const response = await axios.get(`${process.env.API_URL}/hotels?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  });

  return response.data;
} 