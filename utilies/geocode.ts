// utils/geocode.ts
'use server'
import axios from 'axios'

export async function geocodeLocation(location: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY // from .env
  console.log(apiKey)
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    location
  )}&key=${apiKey}`
  const response = await axios.get(url)
  console.log(response.data)
  return response.data
}
