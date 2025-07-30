import CityForm from '@/app/components/cities/CityForm';
import { getCityById } from '@/app/actions/cities/getCityById';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

interface EditCityPageProps {
  params: {
    id: string;
  };
}

const EditCityPage = async ({ params }: EditCityPageProps) => {
  const cityId = parseInt(params.id);

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

  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: ['city', cityId],
      queryFn: () => getCityById(cityId),
    });
  } catch (error) {
    console.error('Error prefetching city data:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CityForm
        mode="edit"
        cityId={cityId}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || ''}
        imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
      />
    </HydrationBoundary>
  );
};

export default EditCityPage; 