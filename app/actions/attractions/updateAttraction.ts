'use server'

import { cookies } from 'next/headers'
import axios from 'axios'

export interface UpdateAttractionData {
  name: string
  poiTypeId: number
  description: string
  address: string
  location: [number, number] // [lon, lat]
  website?: string
  price: number
  discountPrice?: number
  contactEmail?: string
  phone?: string
  openingHours?: string
  avgDuration: string
  isActive: boolean
  mainImageId: number
  galleryImageIds: number[]
  tagIds: number[]
}

export async function updateAttraction(id: number, data: UpdateAttractionData) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      throw new Error('No access token found')
    }

    const response = await axios.patch(`${process.env.API_URL}/attractions/${id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error updating attraction:', error)
    throw error
  }
} 