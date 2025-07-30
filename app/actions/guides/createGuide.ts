'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface CreateGuideData {
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  pricePerDay: number;
  cityId: number;
  description: string;
  avatar: File;
}

export async function createGuide(data: CreateGuideData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('username', data.username);
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('phone', data.phone);
  formData.append('pricePerDay', data.pricePerDay.toString());
  formData.append('cityId', data.cityId.toString());
  formData.append('description', data.description);
  formData.append('avatar', data.avatar);

  const response = await axios.post(`${process.env.API_URL}/guides`, formData, {
    headers: {
      Authorization: `Bearer ${token.value}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
} 