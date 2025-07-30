'use client';

import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCountries } from '@/app/actions/country/getCountries';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { softDeleteCountry } from '@/app/actions/country/softDeleteCountry';
import { updateCountry } from '@/app/actions/country/updateCountry';

const CountriesList = ({ page, limit, imagesUrl, orderBy, orderDir }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(null); // country id or null
  const [deleteModal, setDeleteModal] = useState({ open: false, country: null, error: null });
  const [deactivateLoading, setDeactivateLoading] = useState(null); // country id or null
  const [activateLoading, setActivateLoading] = useState(null); // country id or null
  const [deleteLoading, setDeleteLoading] = useState(false);

  const queryClient = useQueryClient();

  const updateCountryMutation = useMutation({
    mutationFn: ({ countryId, data }) => updateCountry(countryId, data),
    onSuccess: () => {
      setDropdownOpen(null);
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
    onError: (error) => {
      alert(error.message || 'Failed to update country');
    }
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['countries', { page, limit, orderBy, orderDir }],
    queryFn: ({ pageParam = page }) =>
      getCountries({ page: pageParam, limit, orderBy, orderDir }),
    initialPageParam: page,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  const countries = data?.pages.flatMap((page) => page.data) ?? [];

  // Handler to update URL params
  const updateQueryParams = (params) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sp.set(key, value);
      }
    });
    router.push(`?${sp.toString()}`);
  };

  const handleActivateDeactivate = (country) => {
    updateCountryMutation.mutate({
      countryId: country.id,
      data: {
        code: country.code,
        name: country.name,
        currency: country.currency,
        timezone: country.timezone,
        description: country.description,
        is_active: country.is_active ? 0 : 1,
        mainImageId: country.mainImage?.id ?? null,
        galleryImageIds: country.galleryImages?.map(img => img.id) ?? [],
      }
    });
  };

  const handleSoftDelete = async (country) => {
    setDeleteLoading(true);
    setDeleteModal(m => ({ ...m, error: null }));
    try {
      await softDeleteCountry(country.id);
      setDeleteModal({ open: false, country: null, error: null });
    } catch (e) {
      setDeleteModal(m => ({ ...m, error: e.message || 'Failed to delete country' }));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">Countries</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <label className="flex items-center gap-2">
          <span>Order By:</span>
          <select
            value={orderBy}
            onChange={e => updateQueryParams({ orderBy: e.target.value, page: 1 })}
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
            onChange={e => updateQueryParams({ orderDir: e.target.value, page: 1 })}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add Country Button */}
        <Link href="/countries/new">
          <div className="flex items-center justify-center h-40 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl cursor-pointer hover:bg-white/20 transition">
            <Plus className="text-white w-10 h-10" />
          </div>
        </Link>

        {/* Country Cards */}
        {isLoading ? <div>Loading...</div> : countries.map((country) => (
          <div
            key={country.id}
            className="h-40 p-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-xl flex flex-col justify-between text-white shadow-md hover:bg-white/15 transition relative"
          >
            <div className="flex flex-col items-center">
              <div style={{ backgroundImage: `url(${imagesUrl}/${country.mainImage.bucket}/${country.mainImage.objectKey})` }} className="w-16 h-16 bg-cover bg-center rounded-full mb-2" />
              <div className="text-lg font-semibold">{country.name}</div>
            </div>
            <div className="flex justify-end mt-4 relative">
              <button
                className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 flex items-center gap-1"
                onClick={() => setDropdownOpen(dropdownOpen === country.id ? null : country.id)}
              >
                Actions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {dropdownOpen === country.id && (
                <div className="absolute right-0 top-10 z-10 bg-gray-900 border border-gray-700 rounded shadow-lg min-w-[160px]">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-800"
                    onClick={() => router.push(`/countries/edit/${country.id}`)}
                  >
                    <span className="flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit</span>
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-800"
                    disabled={updateCountryMutation.isLoading && updateCountryMutation.variables?.countryId === country.id}
                    onClick={() => handleActivateDeactivate(country)}
                  >
                    <span className="flex items-center gap-2">
                      {updateCountryMutation.isLoading && updateCountryMutation.variables?.countryId === country.id
                        ? (country.is_active ? 'Deactivating...' : 'Activating...')
                        : (country.is_active ? 'Deactivate' : 'Activate')}
                    </span>
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-800 text-red-400"
                    onClick={() => { setDeleteModal({ open: true, country, error: null }); setDropdownOpen(null); }}
                  >
                    <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</span>
                  </button>
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.country && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteModal({ open: false, country: null, error: null })}>
          <div className="bg-gray-900 rounded-lg shadow-lg p-8 min-w-[320px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-white">Are you sure you want to delete <span className="text-red-400">{deleteModal.country.name}</span>?</h2>
            {deleteModal.error && <div className="text-red-400 mb-2">{deleteModal.error}</div>}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setDeleteModal({ open: false, country: null, error: null })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSoftDelete(deleteModal.country)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CountriesList;
