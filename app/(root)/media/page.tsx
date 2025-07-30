import { getAllMedia } from '@/app/actions/media/getAllMedia'
import MediaLibrary from '@/app/components/MediaLibrary'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

interface MediaPageProps {
  searchParams?: {
    page?: string
    limit?: string
  }
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const params = await searchParams
  const page = Number(params?.page) || 1
  const limit = Number(params?.limit) || 10

  const queryClient = new QueryClient()
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['media', { page, limit }],
    queryFn: ({ pageParam = page }) => getAllMedia({ page: pageParam, limit }),
    initialPageParam: page,
    getNextPageParam: (lastPage: { page: number; totalPages: number; }) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
  })
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Media Library</h1>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <MediaLibrary
          apiBaeUrl={process.env.API_URL || ''}
          imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''}
          initialPage={page}
          initialLimit={limit}
        />
      </HydrationBoundary>
    </main>
  )
}
