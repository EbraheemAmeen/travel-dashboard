'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface GetAttractionsParams {
  cityId: number;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'name' | 'price' | 'avgRating';
  orderDir?: 'asc' | 'desc';
  search?: string;
  poiTypeId?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export async function getAttractions(params: GetAttractionsParams) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('cityId', params.cityId.toString());

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDir) queryParams.append('orderDir', params.orderDir);
    if (params.search) queryParams.append('search', params.search);
    if (params.poiTypeId) queryParams.append('poiTypeId', params.poiTypeId.toString());
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await axios.get(
      `${process.env.API_URL}/attractions?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch attractions. An unexpected error occurred.');
  }
} 