'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface CreateRoomTypeData {
  label: string;
  description: string;
  capacity: number;
  totalRooms: number;
  baseNightlyRate: number;
  mainImageId: number;
  galleryImageIds: number[];
}

export async function createRoomType(hotelId: number, data: CreateRoomTypeData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.post(`${process.env.API_URL}/hotels/${hotelId}/room-types`, data, {
    headers: {
      Authorization: `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
} 