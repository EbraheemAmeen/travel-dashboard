// app/actions/trips/deleteTrip.ts
'use server'
import axios from 'axios'
import { cookies } from 'next/headers'

export async function deleteTrip(tripId: number) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) throw new Error('No access token')
  await axios.delete(`${process.env.API_URL}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { success: true }
}
