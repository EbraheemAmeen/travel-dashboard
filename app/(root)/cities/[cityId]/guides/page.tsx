import GuidesList from '@/app/components/guides/GuidesList';

interface GuidesPageProps {
  params: {
    cityId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    orderBy?: string;
    orderDir?: string;
  };
}

export default function GuidesPage({ params, searchParams }: GuidesPageProps) {
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
    <GuidesList 
      cityId={cityId}
      imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
      page={searchParams.page ? parseInt(searchParams.page) : 1}
      limit={searchParams.limit ? parseInt(searchParams.limit) : 10}
      orderBy={searchParams.orderBy as 'createdAt' | 'name' || 'createdAt'}
      orderDir={searchParams.orderDir as 'asc' | 'desc' || 'desc'}
    />
  );
} 