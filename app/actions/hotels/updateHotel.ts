'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface UpdateHotelData {
  name?: string;
  cityId?: number;
  description?: string;
  stars?: number;
  address?: string;
  phone?: string;
  email?: string;
  location?: {
    lat: number;
    lon: number;
  };
  checkInTime?: string;
  checkOutTime?: string;
  currency?: string;
  mainImageId?: number;
  galleryImageIds?: number[];
}

export async function updateHotel(id: number, data: UpdateHotelData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.patch(`${process.env.API_URL}/hotels/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
} 