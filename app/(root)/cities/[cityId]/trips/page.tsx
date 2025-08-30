// app/cities/[cityId]/trips/page.tsx
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query'
import { getAllTrips, GetAllTripsParams } from '@/app/actions/trips/getAllTrips'
import TripsList from '@/app/components/trips/TripsList'

interface PageProps {
  params: { cityId: string }
  searchParams: Record<string, string | undefined>
}

export default async function TripsPage({ params, searchParams }: PageProps) {
  const cityId = Number(params.cityId)
  const page = parseInt(searchParams.page || '1')
  const limit = parseInt(searchParams.limit || '10')
  const orderBy =
    (searchParams.orderBy as 'name' | 'pricePerPerson' | 'startDate') ||
    'startDate'
  const orderDir = (searchParams.orderDir as 'asc' | 'desc') || 'desc'
  const search = searchParams.search || ''

  const fetchParams: GetAllTripsParams = {
    cityId,
    page,
    limit,
    orderBy,
    orderDir,
    search,
    // add other params as needed
  }

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['trips', fetchParams],
    queryFn: () => getAllTrips(fetchParams),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TripsList
        cityId={cityId}
        page={page}
        limit={limit}
        orderBy={orderBy}
        orderDir={orderDir}
        search={search}
        apiUrl={process.env.API_URL!}
        imageUrl={process.env.NEXT_PUBLIC_IMAGES_URL!}
      />
    </HydrationBoundary>
  )
}
