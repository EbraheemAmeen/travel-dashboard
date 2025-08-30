'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

interface Payload {
  note?: string
}

export async function rejectWalletRequest(id: string, payload: Payload) {
  const accessToken = (await cookies()).get('accessToken')?.value

  if (!accessToken) {
    return null
  }

  try {
    const res = await axios.patch(`${process.env.API_URL}/admin/wallet/requests/${id}/reject`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return res.data
  } catch (err) {
    console.error('rejectWalletRequest error', err)
    throw new Error('Failed to reject wallet request')
  }
}



