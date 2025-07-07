'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export async function uploadMediaFiles(formData: FormData) {
  const accessToken = (await cookies()).get('accessToken')?.value;
  
  if (!accessToken) {
    throw new Error('No access token found');
  }

  try {
    const response = await axios.post(
      `${process.env.API_URL}/storage/admin/upload-public`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error('Failed to upload media');
  }
}