'use server'

import { cookies } from 'next/headers'
import axios from 'axios'

export interface Attraction {
  id: number
  name: string
  cityId: number
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
  is_active: boolean
  avgRating: string
  ratingCount: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  city: {
    id: number
    name: string
    slug: string
    description: string
    isActive: boolean
    avgRating: string
    ratingCount: number
    createdAt: string
    updatedAt: string
    deletedAt?: string
    countryId: number
    radius: string
    avgMealPrice: string
  }
  poiType: {
    id: number
    name: string
    description: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
  }
  tags: Array<{
    id: number
    name: string
    description: string
    createdAt: string
    updatedAt: string
  }>
  mainImage: {
    id: number
    bucket: string
    objectKey: string
    mime: string
    size: number | null
    scope: string
    ownerId: string | null
    encrypted: boolean
    uploadedAt: string
    deletedAt?: string
  }
  galleryImages: Array<{
    id: number
    bucket: string
    objectKey: string
    mime: string
    size: number | null
    scope: string
    ownerId: string | null
    encrypted: boolean
    uploadedAt: string
    deletedAt?: string
  }>
}

export async function getAttractionById(id: number): Promise<Attraction> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      throw new Error('No access token found')
    }

    const response = await axios.get(`${process.env.API_URL}/attractions/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    console.log("attraction", response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching attraction:', error)
    throw error
  }
} 