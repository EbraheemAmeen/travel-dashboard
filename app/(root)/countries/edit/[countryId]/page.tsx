import EditCountryForm from "@/app/components/forms/EditCountryForm";
import { getCountryById } from "@/app/actions/country/getCountryById";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface EditCountryPageProps {
  params: {
    countryId: string;
  };
}

const EditCountryPage = async ({ params }: EditCountryPageProps) => {
  const countryId = parseInt(params.countryId);

  if (isNaN(countryId)) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid Country ID</h1>
          <p className="text-gray-400">The provided country ID is not valid.</p>
        </div>
      </div>
    );
  }

  const queryClient = new QueryClient();
  
  try {
    await queryClient.prefetchQuery({
      queryKey: ['country', countryId],
      queryFn: () => getCountryById(countryId),
    });
  } catch (error) {
    console.error('Error prefetching country data:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditCountryForm 
        countryId={countryId}
        apiBaseUrl={process.env.API_URL!} 
        imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL!}
      />
    </HydrationBoundary>
  );
};

export default EditCountryPage; 