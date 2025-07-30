'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function getRoomTypeById(hotelId: number, roomTypeId: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.get(
      `${process.env.API_URL}/hotels/${hotelId}/room-types/${roomTypeId}`,
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
    throw new Error('Failed to fetch room type. An unexpected error occurred.');
  }
} 