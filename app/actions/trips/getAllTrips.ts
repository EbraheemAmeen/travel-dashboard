'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface GetAllTripsParams {
  cityId?: number
  page?: number
  limit?: number
  orderBy?: 'name' | 'pricePerPerson' | 'startDate'
  orderDir?: 'asc' | 'desc'
  tripType?: 'CUSTOM' | 'PREDEFINED'
  withMeals?: boolean
  withTransport?: boolean
  hotelIncluded?: boolean
  minPrice?: number
  maxPrice?: number
  minPeople?: number
  maxPeople?: number
  search?: string
}

export async function getAllTrips(params: GetAllTripsParams = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')

  if (!token) {
    throw new Error('No access token found')
  }

  const queryParams = new URLSearchParams()

  if (params.cityId) queryParams.append('cityId', params.cityId.toString())
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.orderBy) queryParams.append('orderBy', params.orderBy)
  if (params.orderDir) queryParams.append('orderDir', params.orderDir)
  if (params.withMeals)
    queryParams.append('withMeals', params.withMeals ? 'true' : 'false')
  if (params.withTransport)
    queryParams.append('withTransport', params.withTransport ? 'true' : 'false')
  if (params.minPeople)
    queryParams.append('minPeople', params.minPeople.toString())
  if (params.maxPeople)
    queryParams.append('maxPeople', params.maxPeople.toString())
  if (params.minPrice)
    queryParams.append('minPrice', params.minPrice.toString())
  if (params.maxPrice)
    queryParams.append('maxPrice', params.maxPrice.toString())
  if (params.search) queryParams.append('search', params.search)

  const response = await axios.get(
    `${process.env.API_URL}/trips?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  )

  return response.data
}
