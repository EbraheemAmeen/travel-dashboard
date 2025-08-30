import TripForm from '@/app/components/trips/TripForm'
import React from 'react'
interface PageProps {
  params: { cityId: string; tripId: string }
}
const EditTripPage = async ({ params }: PageProps) => {
  const param = await params

  return (
    <TripForm
      mode="edit"
      cityId={Number(param.cityId)}
      tripId={Number(param.tripId)}
      apiBaseUrl={process.env.API_URL || ''}
      imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
    />
  )
}
export default EditTripPage
