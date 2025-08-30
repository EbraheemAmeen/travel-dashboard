'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface GetGuidesParams {
  guideId: string
}

export async function getGuideById(params: GetGuidesParams) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')

  if (!token) {
    throw new Error('No access token found')
  }

  const response = await axios.get(
    `${process.env.API_URL}/guides/${params.guideId}`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  )

  return response.data
}
