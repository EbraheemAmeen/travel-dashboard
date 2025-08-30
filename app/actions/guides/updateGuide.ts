'use server'

import axios from 'axios'
import { cookies } from 'next/headers'

export interface UpdateGuideData {
  name: string
  phone: string
  pricePerDay: number
  birthDate: string
  cityId: number
  description: string
  avatar?: File
}

export async function updateGuide(id: string, data: UpdateGuideData) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')

    if (!token) {
      throw new Error('No access token found')
    }

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('phone', data.phone)
    formData.append('pricePerDay', data.pricePerDay.toString())
    formData.append('cityId', data.cityId.toString())
    formData.append('description', data.description)
    if (data.birthDate) {
      formData.append('birthDate', data.birthDate)
    }
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

    const response = await axios.patch(
      `${process.env.API_URL}/guides/${id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  } catch (error) {
    console.log('error', error)
    throw error
  }
}
