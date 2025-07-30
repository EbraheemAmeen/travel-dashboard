'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface UpdateRoomTypeData {
  label?: string;
  description?: string;
  capacity?: number;
  totalRooms?: number;
  baseNightlyRate?: number;
  mainImageId?: number;
  galleryImageIds?: number[];
}

export async function updateRoomType(hotelId: number, roomTypeId: number, data: UpdateRoomTypeData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.patch(`${process.env.API_URL}/hotels/${hotelId}/room-types/${roomTypeId}`, data, {
    headers: {
      Authorization: `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
} 