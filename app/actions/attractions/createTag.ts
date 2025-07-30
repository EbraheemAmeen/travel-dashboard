'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface CreateTagData {
  name: string;
  description: string;
}

export async function createTag(data: CreateTagData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.post(
      `${process.env.API_URL}/tags`,
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
    throw new Error('Failed to create tag. An unexpected error occurred.');
  }
} 