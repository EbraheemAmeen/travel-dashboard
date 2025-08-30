'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

/** GET /trips/:id */
export async function getTrip(tripId: number) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')
    if (!token) throw new Error('No access token found')

    const { data } = await axios.get(`${process.env.API_URL}/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })

    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error('Failed to fetch trip. An unexpected error occurred.')
  }
}
