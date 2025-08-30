'use server'
import axios from 'axios'
import { cookies } from 'next/headers'

export interface CreateTripPayload {
  name: string
  cityId: number
  tripType: 'PREDEFINED' | 'CUSTOM'
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD (checkout exclusive)
  pricePerPerson: number
  minPeople: number
  maxPeople: number
  minSeatsPerUser: number
  maxSeatsPerUser: number
  withMeals: boolean
  withTransport: boolean
  hotelIncluded: boolean
  mealPricePerPerson?: number
  transportationPricePerPerson?: number
  guideId?: string | null

  meetLocationAddress?: string
  meetLocation?: { lat: number; lon: number } | null

  dropLocationAddress?: string
  dropLocation?: { lat: number; lon: number } | null

  mainImageId: number // required by your form
  galleryImageIds: number[] // []

  tripDays: Array<{
    dayNumber: number
    startTime: string // 'HH:mm'
    endTime: string // 'HH:mm'
    description?: string
    pois: Array<{ poiId: number; visitOrder: number }>
  }>

  hotels: Array<{
    hotelId: number
    roomTypeId: number
    roomsNeeded: number
  }>

  tagIds: number[]
}

/** POST /trips */
export async function createTrip(payload: CreateTripPayload) {
  try {
    console.log('trip data', payload)
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')
    if (!token) throw new Error('No access token found')

    const { data } = await axios.post(`${process.env.API_URL}/trips`, payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    })

    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      console.log('error', error)
      throw new Error(error.response.data.message)
    }
    throw new Error('Failed to create trip. An unexpected error occurred.')
  }
}
