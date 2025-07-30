'use server';

import axios from 'axios';
import { cookies } from 'next/headers';

export interface CreateAttractionData {
  name: string;
  cityId: number;
  poiTypeId: number;
  description: string;
  address: string;
  location: [number, number]; // [longitude, latitude]
  website?: string;
  price: number;
  discountPrice?: number;
  contactEmail?: string;
  phone?: string;
  openingHours?: string;
  avgDuration: string; // Format: "HH:MM:SS"
  isActive: boolean;
  mainImageId: number;
  galleryImageIds: number[];
  tagIds: number[];
}

export async function createAttraction(data: CreateAttractionData) {
  try {
    console.log("data",data);
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken');

    if (!token) {
      throw new Error('No access token found');
    }

    const response = await axios.post(
      `${process.env.API_URL}/attractions`,
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
    throw new Error('Failed to create attraction. An unexpected error occurred.');
  }
} 