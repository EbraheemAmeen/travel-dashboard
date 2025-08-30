// app/cities/[cityId]/trips/components/TripsList.tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { getAllTrips, GetAllTripsParams } from '@/app/actions/trips/getAllTrips'
import { deleteTrip } from '@/app/actions/trips/deleteTrip'
import { showSuccsesToast } from '@/app/lib/SuccessToastUtils'
import { showErrorToast } from '@/app/lib/ErrorToastUtils'

interface TripsListProps {
  cityId: number
  page: number
  limit: number
  orderBy: 'name' | 'pricePerPerson' | 'startDate'
  orderDir: 'asc' | 'desc'
  search: string
  tripType?: 'CUSTOM' | 'PREDEFINED'
  withMeals?: boolean
  withTransport?: boolean
  hotelIncluded?: boolean
  minPrice?: number
  maxPrice?: number
  minPeople?: number
  maxPeople?: number
  apiUrl: string
  imageUrl: string
}

export default function TripsList({
  cityId,
  page,
  limit,
  orderBy,
  orderDir,
  search,
  tripType,
  withMeals,
  withTransport,
  hotelIncluded,
  minPrice,
  maxPrice,
  minPeople,
  maxPeople,
  apiUrl,
  imageUrl,
}: TripsListProps) {
  const queryClient = useQueryClient()
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    trip: any | null
  }>({
    open: false,
    trip: null,
  })
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchParams: GetAllTripsParams = {
    cityId,
    page,
    limit,
    orderBy,
    orderDir,
    search,
    tripType,
    withMeals,
    withTransport,
    hotelIncluded,
    minPrice,
    maxPrice,
    minPeople,
    maxPeople,
  }

  const {
    data: tripsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trips', fetchParams],
    queryFn: () => getAllTrips(fetchParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTrip(id),
    onSuccess: () => {
      showSuccsesToast('Trip deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      setDeleteModal({ open: false, trip: null })
    },
    onError: (err: any) => {
      showErrorToast('Failed to delete trip')
      setDeleteError(err.response?.data?.message || err.message)
    },
  })

  const trips = tripsData?.data || []
  const totalPages = tripsData?.totalPages || 1

  const confirmDelete = () => {
    if (deleteModal.trip) deleteMutation.mutate(deleteModal.trip.id)
  }

  if (isLoading) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading trips...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Error Loading Trips
          </h1>
          <p className="text-gray-400">Failed to load trips.</p>
        </div>
      </div>
    )
  }

  const updateParam = (key: string, value?: string) => {
    const url = new URL(window.location.href)
    if (value == null || value === '') url.searchParams.delete(key)
    else url.searchParams.set(key, value)
    if (key !== 'page') url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Trips</h1>
          <Link
            href={`/cities/${cityId}/trips/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add New Trip
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order By
              </label>
              <select
                value={orderBy}
                onChange={(e) => updateParam('orderBy', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="startDate">Start Date</option>
                <option value="name">Name</option>
                <option value="pricePerPerson">Price</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Direction
              </label>
              <select
                value={orderDir}
                onChange={(e) => updateParam('orderDir', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trip Type
              </label>
              <select
                value={tripType || ''}
                onChange={(e) => updateParam('tripType', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">All</option>
                <option value="CUSTOM">Custom</option>
                <option value="PREDEFINED">Predefined</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meals
              </label>
              <select
                value={withMeals == null ? '' : withMeals.toString()}
                onChange={(e) => updateParam('withMeals', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Transport
              </label>
              <select
                value={withTransport == null ? '' : withTransport.toString()}
                onChange={(e) => updateParam('withTransport', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hotel
              </label>
              <select
                value={hotelIncluded == null ? '' : hotelIncluded.toString()}
                onChange={(e) => updateParam('hotelIncluded', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Price
              </label>
              <input
                type="number"
                value={minPrice ?? ''}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Price
              </label>
              <input
                type="number"
                value={maxPrice ?? ''}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min People
              </label>
              <input
                type="number"
                value={minPeople ?? ''}
                onChange={(e) => updateParam('minPeople', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max People
              </label>
              <input
                type="number"
                value={maxPeople ?? ''}
                onChange={(e) => updateParam('maxPeople', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search trips..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {console.log('trips', trips)}
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
            >
              {trip.mainImage && (
                <div className="relative h-48">
                  <Image
                    src={`${imageUrl}/${trip.mainImage.objectKey}`}
                    alt={trip.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {trip.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{trip.description}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">
                      ${trip.pricePerPerson} pp
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white">
                      {new Date(trip.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/cities/${cityId}/trips/${trip.id}/edit`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setDeleteModal({ open: true, trip })
                      setDeleteError(null)
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                const url = new URL(window.location.href)
                url.searchParams.set('page', p.toString())
                return (
                  <Link
                    key={p}
                    href={url.toString()}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Delete Trip</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete “{deleteModal.trip?.name}”? This
                action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-400 mb-4">{deleteError}</p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, trip: null })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
