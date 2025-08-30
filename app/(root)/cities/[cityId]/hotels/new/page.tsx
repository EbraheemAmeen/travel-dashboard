import HotelForm from '@/app/components/hotels/HotelForm';

interface NewHotelPageProps {
  params: {
    cityId: string;
  };
}

export default function NewHotelPage({ params }: NewHotelPageProps) {
  const cityId = parseInt(params.cityId);

  if (isNaN(cityId)) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid City ID</h1>
          <p className="text-gray-400">The provided city ID is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <HotelForm
      mode="add"
      cityId={cityId}
      apiBaseUrl={process.env.API_URL || ''}
      imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
    />
  );
} 