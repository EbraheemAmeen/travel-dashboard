import TripForm from '@/app/components/trips/TripForm'
import React from 'react'
interface PageProps {
  params: { cityId: string }
}
const NewTripPage = async ({ params }: PageProps) => {
  const param = await params

  return (
    <TripForm
      mode="add"
      cityId={Number(param.cityId)}
      apiBaseUrl={process.env.API_URL || ''}
      imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
    />
  )
}
export default NewTripPage
