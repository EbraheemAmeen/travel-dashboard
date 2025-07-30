'use client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getCities } from '@/app/actions/cities/getCities';
import { getCountries } from '@/app/actions/country/getCountries';
import Link from 'next/link';
import { useState } from 'react';

export default function CitiesList({ imagesUrl }: { imagesUrl: string }) {
  const queryClient = useQueryClient();
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState<string>('');
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; city: any | null }>({ open: false, city: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => getCountries({ page: 1, limit: 100 }),
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cities', { page, limit, orderBy, orderDir, countryId, isActive, search }],
    queryFn: () => getCities({ page, limit, orderBy, orderDir, countryId, isActive: isActive === '' ? undefined : isActive === 'true', search }),
  });

  // Placeholder for delete mutation
  // const deleteMutation = useMutation({ ... });

  const cities = data?.data || [];
  const totalPages = data?.totalPages || 1;
  console.log("cities",cities)
  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
        <h1 className="text-3xl font-bold">Cities</h1>
        <Link href="/cities/new">
          <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold">Add New City</button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <label className="flex items-center gap-2">
          <span>Country:</span>
          <select
            value={countryId ?? ''}
            onChange={e => setCountryId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="">All</option>
            {countries && countries.data && countries.data.map((country: any) => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Status:</span>
          <select
            value={isActive}
            onChange={e => setIsActive(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Order By:</span>
          <select
            value={orderBy}
            onChange={e => setOrderBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="createdAt">Created At</option>
            <option value="name">Name</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Direction:</span>
          <select
            value={orderDir}
            onChange={e => setOrderDir(e.target.value as 'asc' | 'desc')}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span>Search:</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
            placeholder="Search cities..."
          />
        </label>
        <label className="flex items-center gap-2">
          <span>Limit:</span>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            {[10, 20, 50, 100].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4">
        {isLoading && <div className="text-center py-8">Loading...</div>}
        {isError && <div className="text-center py-8 text-red-400">{(error as Error).message || 'Failed to load cities.'}</div>}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cities.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">No cities found.</div>
            )}
            {cities.map((city: any) => (
              <div
                key={city.id}
                className="h-40 p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl flex flex-col justify-between text-white shadow-md hover:bg-white/15 transition relative"
              >
                <Link href={`/cities/${city.id}`} className="flex flex-col items-center">
                  <div style={{ backgroundImage: `url(${imagesUrl}/${city.mainImage.bucket}/${city.mainImage.objectKey})` }} className="w-16 h-16 bg-cover bg-center rounded-full mb-2" />
                  <div className="text-lg font-semibold">{city.name}</div>
                  <div className="text-xs text-gray-400">{city.countryId && countries?.data?.find((c: any) => c.id === city.countryId)?.name}</div>
                </Link>
                <div className="flex justify-end mt-4 gap-2">
                  <Link href={`/cities/edit/${city.id}`}><button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Edit</button></Link>
                  {/* <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm">Delete</button> */}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
} 