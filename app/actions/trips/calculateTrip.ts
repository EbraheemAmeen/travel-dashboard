'use server'
import axios from 'axios'

export type CalculateTripPayload = {
  cityId: number
  startDate: string
  endDate: string
  people: number
  withMeals: boolean
  withTransport: boolean
  hotelIncluded: boolean
  includeGuide?: boolean
  guideId?: string
  meetLocation?: { locationAddress: string; lon: number; lat: number }
  dropLocation?: { locationAddress: string; lon: number; lat: number }
  pois?: { poiId: number; dayNumber: number; visitOrder: number }[]
  hotels?: { hotelId: number; roomTypeId: number; roomsRequested: number }[]
}

export const calculateTrip = async (data: CalculateTripPayload) => {
    try {
        console.log("data ",data)
        console.log("url ",`${process.env.API_URL}/trips/calculate`)
        const res = await axios.post(`${process.env.API_URL}/trips/calculate`, data)
        console.log("res data ",res.data)
  return res.data
    } catch (error) {
        console.log("error",error)
    }
  const res = await axios.post(`${process.env.API_URL}/trips/calculate`, data)
  return res.data
}

export default calculateTrip


