'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export async function softDeleteCountry(id: number) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) {
    throw new Error('No access token found');
  }
  try {
    const response = await axios.patch(
      `${process.env.API_URL}/countries/${id}/soft-delete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to delete country');
  }
} 