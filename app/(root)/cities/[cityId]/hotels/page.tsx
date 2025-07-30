import HotelsList from '@/app/components/hotels/HotelsList';

interface HotelsPageProps {
  params: {
    cityId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    orderBy?: string;
    orderDir?: string;
    search?: string;
    stars?: string;
    isActive?: string;
  };
}

export default function HotelsPage({ params, searchParams }: HotelsPageProps) {
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
    <HotelsList 
      cityId={cityId}
      page={searchParams.page ? parseInt(searchParams.page) : 1}
      limit={searchParams.limit ? parseInt(searchParams.limit) : 10}
      orderBy={searchParams.orderBy as 'createdAt' | 'name' | 'stars' | 'avgRating' || 'createdAt'}
      orderDir={searchParams.orderDir as 'asc' | 'desc' || 'desc'}
      search={searchParams.search || ''}
      stars={searchParams.stars ? parseInt(searchParams.stars) : undefined}
      isActive={searchParams.isActive === 'true' ? true : searchParams.isActive === 'false' ? false : undefined}
    />
  );
} 