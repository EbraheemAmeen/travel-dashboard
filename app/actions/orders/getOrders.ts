'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface GetOrdersParams {
  page?: number
  limit?: number
}

export async function getOrders(params: GetOrdersParams = {}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')

  if (!token) {
    throw new Error('No access token found')
  }

  const query = new URLSearchParams()
  if (params.page) query.append('page', String(params.page))
  if (params.limit) query.append('limit', String(params.limit))

  const url = `${process.env.API_URL}/orders/admin${query.toString() ? `?${query.toString()}` : ''}`

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  })

  return response.data
}

export default getOrders


