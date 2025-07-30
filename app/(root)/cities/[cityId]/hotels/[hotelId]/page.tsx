import { getHotelById } from '@/app/actions/hotels/getHotelById';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import HotelView from '@/app/components/hotels/HotelView';

interface HotelPageProps {
  params: {
    cityId: string;
    hotelId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    orderBy?: string;
    orderDir?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    minCapacity?: string;
    isActive?: string;
  };
}

const HotelPage = async ({ params, searchParams }: HotelPageProps) => {
  const search = await searchParams;
  const param = await params;
  const cityId = parseInt(param.cityId);
  const hotelId = parseInt(param.hotelId);

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
      <HotelView 
        cityId={cityId}
        hotelId={hotelId}
        page={search.page ? parseInt(search.page) : 1}
        limit={search.limit ? parseInt(search.limit) : 10}
        orderBy={search.orderBy as 'createdAt' | 'label' | 'baseNightlyRate' | 'capacity' || 'createdAt'}
        orderDir={search.orderDir as 'asc' | 'desc' || 'desc'}
        search={search.search || ''}
        minPrice={search.minPrice ? parseFloat(search.minPrice) : undefined}
        maxPrice={search.maxPrice ? parseFloat(search.maxPrice) : undefined}
        minCapacity={search.minCapacity ? parseInt(search.minCapacity) : undefined}
        isActive={search.isActive === 'true' ? true : search.isActive === 'false' ? false : undefined}
      />
    </HydrationBoundary>
  );
};

export default HotelPage; 