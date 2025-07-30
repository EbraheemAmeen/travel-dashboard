'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function getHotelById(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(`${process.env.API_URL}/hotels/${id}`, {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  });

  return response.data;
} 