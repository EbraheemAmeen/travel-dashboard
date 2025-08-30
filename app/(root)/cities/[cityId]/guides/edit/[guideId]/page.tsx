import GuideForm from '@/app/components/guides/GuideForm'
import React from 'react'

interface EditGuidePageProps {
  params: {
    cityId: string
    guideId: string
  }
}
const EditGuidePage = async ({ params }: EditGuidePageProps) => {
  const param = await params
  const guideId = param.guideId
  const cityId = parseInt(param.cityId)
  return (
    <GuideForm
      imageUrl={process.env.NEXT_PUBLIC_IMAGES_URL}
      guideId={guideId}
      mode="edit"
      cityId={cityId}
    />
  )
}

export default EditGuidePage
