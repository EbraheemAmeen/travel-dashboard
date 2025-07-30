'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

interface UpdateCountryData {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  description: string;
  is_active: number;
  mainImageId: number | null;
  galleryImageIds: number[];
}

export async function updateCountry(countryId: number, countryData: UpdateCountryData): Promise<any> {
  try {
    const accessToken = (await cookies()).get('accessToken')?.value;

    if (!accessToken) {
      throw new Error('Access token not found. Please log in to perform this action.');
    }

    console.log('Sending updated country data:', countryData);

    const response = await axios.put(
      `${process.env.API_URL}/countries/${countryId}`,
      countryData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update country. An unexpected error occurred.');
  }
} 