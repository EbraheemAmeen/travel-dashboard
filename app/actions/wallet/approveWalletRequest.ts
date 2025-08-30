'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

interface Payload {
  note?: string
}

export async function approveWalletRequest(id: string, payload: Payload) {
  const accessToken = (await cookies()).get('accessToken')?.value

  if (!accessToken) {
    return null
  }

  try {
    const res = await axios.patch(`${process.env.API_URL}/admin/wallet/requests/${id}/approve`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return res.data
  } catch (err) {
    console.error('approveWalletRequest error', err)
    throw new Error('Failed to approve wallet request')
  }
}



