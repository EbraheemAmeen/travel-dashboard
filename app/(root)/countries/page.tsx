import { getCountries } from "@/app/actions/country/getCountries";
import CountriesList from "@/app/components/getComponents/CountriesList";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
interface MediaPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
  };


}


const CountriesPage = async ({ searchParams }: MediaPageProps) => {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['country', { page, limit }],
    queryFn: ({ pageParam = page }) => getCountries({ page: pageParam, limit }),
    initialPageParam: page,
    getNextPageParam: (lastPage: { page: number; totalPages: number; }) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
  return (

    <HydrationBoundary state={dehydrate(queryClient)}>
        <CountriesList />
    </HydrationBoundary>

  );
};

export default CountriesPage;