'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

interface Params {
  page?: number
  limit?: number
  search?: string
  status?: string
  source?: string
}

export async function getWalletTransactions({ page = 1, limit = 20, search, status, source }: Params = {}) {
  const accessToken = (await cookies()).get('accessToken')?.value

  if (!accessToken) {
    return null
  }

  try {
    const res = await axios.get(`${process.env.API_URL}/admin/wallet/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
      },
    })

    return res.data
  } catch (err) {
    console.error('getWalletTransactions error', err)
    throw new Error('Failed to fetch wallet transactions')
  }
} 