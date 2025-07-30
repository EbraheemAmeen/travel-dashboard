'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

interface CountryImage {
  id: number;
  bucket: string;
  objectKey: string;
  mime: string;
  size: number | null;
  scope: string;
  ownerId: string | null;
  encrypted: boolean;
  uploadedAt: string;
  deletedAt: string | null;
}

interface CountryData {
  id: number;
  code: string;
  name: string;
  currency: string;
  timezone: string;
  description: string;
  is_active: boolean;
  avgRating: string;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  mainImage: CountryImage;
  galleryImages: CountryImage[];
}

export async function getCountryById(countryId: number): Promise<CountryData> {
  try {
    const accessToken = (await cookies()).get('accessToken')?.value;

    if (!accessToken) {
      throw new Error('Access token not found. Please log in to perform this action.');
    }

    const response = await axios.get(
      `${process.env.API_URL}/countries/${countryId}`,
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
    throw new Error('Failed to fetch country. An unexpected error occurred.');
  }
} 