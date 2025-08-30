'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface GetHotelsParams {
  cityId?: number
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}

export async function getAvailableHotels(params: GetHotelsParams = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')

  if (!token) {
    throw new Error('No access token found')
  }

  const queryParams = new URLSearchParams()

  if (params.cityId) queryParams.append('cityId', params.cityId.toString())
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const response = await axios.get(
    `${process.env.API_URL}/hotels/available?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  )

  return response.data
}
