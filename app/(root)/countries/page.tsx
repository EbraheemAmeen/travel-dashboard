import { getCountries } from "@/app/actions/country/getCountries";
import CountriesList from "@/app/components/getComponents/CountriesList";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
interface MediaPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
    orderBy?: 'createdAt' | 'name';
    orderDir?: 'asc' | 'desc';
  };
}

const CountriesPage = async ({ searchParams }: MediaPageProps) => {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;
  const orderBy = params?.orderBy === 'name' ? 'name' : 'createdAt';
  const orderDir = params?.orderDir === 'asc' ? 'asc' : 'desc';

  const queryClient = new QueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['country', { page, limit, orderBy, orderDir }],
    queryFn: ({ pageParam = page }) => getCountries({ page: pageParam, limit, orderBy, orderDir }),
    initialPageParam: page,
    getNextPageParam: (lastPage: { page: number; totalPages: number; }) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
  return (
<Suspense fallback={<div>Loading...</div>}>
    <HydrationBoundary state={dehydrate(queryClient)}>
        <CountriesList
        imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
        page={page}
        limit={limit}
        orderBy={orderBy}
        orderDir={orderDir}
        />
    </HydrationBoundary>
    </Suspense>
  );
};

export default CountriesPage;