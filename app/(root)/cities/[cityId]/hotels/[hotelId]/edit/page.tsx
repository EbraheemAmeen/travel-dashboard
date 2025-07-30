import HotelForm from '@/app/components/hotels/HotelForm';
import { getHotelById } from '@/app/actions/hotels/getHotelById';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

interface EditHotelPageProps {
  params: {
    cityId: string;
    hotelId: string;
  };
}

const EditHotelPage = async ({ params }: EditHotelPageProps) => {
  const cityId = parseInt(params.cityId);
  const hotelId = parseInt(params.hotelId);

  if (isNaN(cityId) || isNaN(hotelId)) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid ID</h1>
          <p className="text-gray-400">The provided city or hotel ID is not valid.</p>
        </div>
      </div>
    );
  }

  const queryClient = new QueryClient();
  
  try {
    await queryClient.prefetchQuery({
      queryKey: ['hotel', hotelId],
      queryFn: () => getHotelById(hotelId),
    });
  } catch (error) {
    console.error('Error prefetching hotel data:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HotelForm
        mode="edit"
        cityId={cityId}
        hotelId={hotelId}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || ''}
        imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
      />
    </HydrationBoundary>
  );
};

export default EditHotelPage; 