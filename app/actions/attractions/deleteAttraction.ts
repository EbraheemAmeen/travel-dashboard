'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export async function deleteAttraction(id: number) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      throw new Error('No access token found')
    }

    const response = await axios.delete(`${process.env.API_URL}/attractions/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error deleting attraction:', error)
    throw error
  }
} 