// utils/api/country.ts
'use server'; // This directive marks the file to be executed on the server

import axios from 'axios';
import { cookies } from 'next/headers'; // Used to access request cookies on the server


interface NewCountryData {
  code: string; // The two-letter country code (e.g., "US", "SY")
  name: string; // The full country name (e.g., "United States", "Syria")
  currency: string; // The currency code (e.g., "USD", "EUR")
  timezone: string; // The timezone (e.g., "America/New_York", "Europe/London")
  description: string; // The country description
  isActive: number; // The active status (1 for active, 0 for inactive)
  mainImageId: number | null; // The ID of the main image, or null if not selected
  galleryImageIds: number[]; // An array of IDs for gallery images
}

export async function createCountry(countryData: NewCountryData): Promise<any> {
  try {
    // Retrieve the accessToken from the request cookies.
    // This is safe because this function is marked as 'use server'.
    const accessToken = (await cookies()).get('accessToken')?.value;

    // Throw an error if the access token is missing.
    if (!accessToken) {
      throw new Error('Access token not found. Please log in to perform this action.');
    }

    // Log the data being sent to the API.
    console.log('Sending new country data:', countryData);

    // Make the POST request to the API.
    // The API_URL should be defined in your environment variables (e.g., .env.local).
    const response = await axios.post(
      `${process.env.API_URL}/countries`, // Ensure process.env.API_URL is correctly configured
      countryData, // The payload containing the new country's data
      {
        headers: {
          // Set the Authorization header with the Bearer token.
          Authorization: `Bearer ${accessToken}`,
          // Specify the content type of the request body.
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the data received from the API.
    return response.data;
  } catch (error: any) {
    // Custom error handling for Axios errors.
    // If it's an Axios error and has a response message, use that message.
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    // Otherwise, throw a generic error message.
    throw new Error('Failed to create country. An unexpected error occurred.');
  }
}
