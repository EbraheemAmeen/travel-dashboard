 'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function deleteMedia(id: number) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  if (!accessToken) {
    throw new Error('No access token found');
  }
  try {
    const response = await axios.delete(
      `${process.env.API_URL}/storage/admin/file/${id}`,
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
    throw new Error('Failed to delete media');
  }
}
