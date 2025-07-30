'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface CreatePoiTypeData {
  name: string;
  description: string;
}

export async function createPoiType(data: CreatePoiTypeData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.post(
      `${process.env.API_URL}/poi-types`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to create POI type. An unexpected error occurred.');
  }
} 