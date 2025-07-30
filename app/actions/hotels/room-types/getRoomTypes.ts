'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface GetRoomTypesParams {
  hotelId: number;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'label' | 'baseNightlyRate' | 'capacity';
  orderDir?: 'asc' | 'desc';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  isActive?: boolean;
}

export async function getRoomTypes(params: GetRoomTypesParams) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderDir) queryParams.append('orderDir', params.orderDir);
    if (params.search) queryParams.append('search', params.search);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.minCapacity) queryParams.append('minCapacity', params.minCapacity.toString());
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await axios.get(
      `${process.env.API_URL}/hotels/${params.hotelId}/room-types?${queryParams.toString()}`,
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
    throw new Error('Failed to fetch room types. An unexpected error occurred.');
  }
} 