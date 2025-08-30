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
/** PATCH /trips/:id  (optional, but handy) */
export async function updateTrip(
  tripId: number,
  patch: Partial<CreateTripPayload>
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')
    if (!token) throw new Error('No access token found')
console.log("updated data ",patch)
    const { data } = await axios.patch(
      `${process.env.API_URL}/trips/${tripId}`,
      patch,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error('Failed to update trip. An unexpected error occurred.')
  }
}
