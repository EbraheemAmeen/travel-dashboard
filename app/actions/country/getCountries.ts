'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: 'createdAt' | 'name';
  orderDir?: 'asc' | 'desc';
}

export async function getCountries({ page, limit, orderBy, orderDir }: PaginationParams) {
  const accessToken = (await cookies()).get('accessToken')?.value;
    
  if (!accessToken) {
    console.log('No access token found');
    return null;
  }

  try {
    const response = await axios.get(
      `${process.env.API_URL}/countries`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page,
          limit,
          ...(orderBy ? { orderBy } : {}),
          ...(orderDir ? { orderDir } : {}),
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw new Error('Failed to fetch media');
  }
}