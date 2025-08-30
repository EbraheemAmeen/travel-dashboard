'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface GetGuidesParams {
  cityId?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export async function getAvalibleGuides(params: GetGuidesParams = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')

  if (!token) {
    throw new Error('No access token found')
  }

  const queryParams = new URLSearchParams()

  if (params.cityId) queryParams.append('cityId', params.cityId.toString())
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())

  const response = await axios.get(
    `${process.env.API_URL}/guides/available?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  )

  return response.data
}
