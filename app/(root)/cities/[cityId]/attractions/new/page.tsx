import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getCityById } from '@/app/actions/cities/getCityById';
import AttractionForm from '@/app/components/attractions/AttractionForm';

interface PageProps {
  params: {
    cityId: string;
  };
}

export default async function AddAttractionPage({ params }: PageProps) {
  const queryClient = new QueryClient();
  const param = await params;

  // Prefetch the city data for map center and radius
  await queryClient.prefetchQuery({
    queryKey: ['city', Number(param.cityId)],
    queryFn: () => getCityById(Number(param.cityId)),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-5">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Attraction</h1>
          <p className="text-gray-600">Create a new attraction for this city</p>
        </div>
        <AttractionForm 
          mode="add" 
          cityId={Number(param.cityId)}
          imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL!}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL!}
        />
      </div>
    </HydrationBoundary>
  );
} 