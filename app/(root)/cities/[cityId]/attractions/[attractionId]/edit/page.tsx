import AttractionForm from '@/app/components/attractions/AttractionForm'

interface EditAttractionPageProps {
  params: {
    cityId: string
    attractionId: string
  }
}

export default function EditAttractionPage({ params }: EditAttractionPageProps) {
  const { cityId, attractionId } = params

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Edit Attraction</h1>
        <p className="text-gray-400 mt-2">Update attraction information and details</p>
      </div>

      <AttractionForm
        mode="edit"
        cityId={parseInt(cityId)}
        attractionId={parseInt(attractionId)}
        imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
        apiBaseUrl={process.env.API_URL || ''}
      />
    </div>
  )
} 