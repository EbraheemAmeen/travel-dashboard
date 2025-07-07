'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCountries } from '@/app/actions/country/getCountries';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const CountriesList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['countries'],
    queryFn: ({ pageParam = 1 }) =>
      getCountries({ page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const countries = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Countries</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Country Button */}
        <Link href="/countries/new">
          <div className="flex items-center justify-center h-40 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl cursor-pointer hover:bg-white/20 transition">
            <Plus className="text-white w-10 h-10" />
          </div>
        </Link>

        {/* Country Cards */}
        {countries.map((country) => (
          <div
            key={country.id}
            className="h-40 p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl flex flex-col justify-between text-white shadow-md hover:bg-white/15 transition"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 rounded-full mb-2" />
              <div className="text-lg font-semibold">{country.name}</div>
            </div>
            <div className="flex justify-between mt-4">
              <Link href={`/country/edit/${country.id}`}>
                <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-200">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              </Link>
              <button className="flex items-center gap-1 text-sm text-red-400 hover:text-red-200">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 mt-4 text-center">{error.message}</p>
      )}
    </main>
  );
};

export default CountriesList;
