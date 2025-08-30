'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

interface Params {
  page?: number
  limit?: number
}

export async function getWalletRequests({ page = 1, limit = 10 }: Params = {}) {
  const accessToken = (await cookies()).get('accessToken')?.value

  if (!accessToken) {
    return null
  }

  try {
    const res = await axios.get(`${process.env.API_URL}/admin/wallet/requests`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, limit },
    })

    return res.data
  } catch (err) {
    console.error('getWalletRequests error', err)
    throw new Error('Failed to fetch wallet requests')
  }
}



