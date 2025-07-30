import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import AttractionsList from '@/app/components/attractions/AttractionsList';

interface PageProps {
  params: {
    cityId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    orderBy?: string;
    orderDir?: string;
    search?: string;
    poiTypeId?: string;
    minPrice?: string;
    maxPrice?: string;
    isActive?: string;
  };
}

export default async function AttractionsPage({ params, searchParams }: PageProps) {
  const queryClient = new QueryClient();
  const param = await params;

  const page = parseInt(searchParams.page || '1');
  const limit = parseInt(searchParams.limit || '10');
  const orderBy = (searchParams.orderBy as 'createdAt' | 'name' | 'price' | 'avgRating') || 'createdAt';
  const orderDir = (searchParams.orderDir as 'asc' | 'desc') || 'desc';
  const search = searchParams.search || '';
  const poiTypeId = searchParams.poiTypeId ? parseInt(searchParams.poiTypeId) : undefined;
  const minPrice = searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined;
  const isActive = searchParams.isActive ? searchParams.isActive === 'true' : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AttractionsList
        cityId={Number(param.cityId)}
        page={page}
        limit={limit}
        orderBy={orderBy}
        orderDir={orderDir}
        search={search}
        poiTypeId={poiTypeId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        isActive={isActive}
      />
    </HydrationBoundary>
  );
} 