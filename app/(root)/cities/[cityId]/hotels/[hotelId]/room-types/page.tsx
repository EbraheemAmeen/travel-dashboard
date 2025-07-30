import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import RoomTypesList from '@/app/components/hotels/room-types/RoomTypesList';

interface PageProps {
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

export default async function RoomTypesPage({ params, searchParams }: PageProps) {
    const queryClient = new QueryClient()

  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '10');
  const orderBy = (searchParams.orderBy as 'createdAt' | 'label' | 'baseNightlyRate' | 'capacity') || 'createdAt';
  const orderDir = (searchParams.orderDir as 'asc' | 'desc') || 'desc';
  const search = searchParams.search || '';
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;
  const minCapacity = searchParams.minCapacity ? parseInt(searchParams.minCapacity) : undefined;
  const isActive = searchParams.isActive ? searchParams.isActive === 'true' : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoomTypesList
        cityId={Number(params.cityId)}
        hotelId={Number(params.hotelId)}
        page={page}
        limit={limit}
        orderBy={orderBy}
        orderDir={orderDir}
        search={search}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minCapacity={minCapacity}
        isActive={isActive}
      />
    </HydrationBoundary>
  );
} 