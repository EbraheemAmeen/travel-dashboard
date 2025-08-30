'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGuides } from '@/app/actions/guides/getGuides'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

interface GuidesListProps {
  cityId: number
  page: number
  limit: number
  imagesUrl: string
  orderBy: 'createdAt' | 'name'
  orderDir: 'asc' | 'desc'
}

export default function GuidesList({
  cityId,
  page,
  limit,
  imagesUrl,
  orderBy,
  orderDir,
}: GuidesListProps) {
  const queryClient = useQueryClient()
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    guide: any | null
  }>({ open: false, guide: null })
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['guides', cityId, page, limit, orderBy, orderDir],
    queryFn: () =>
      getGuides({
        cityId,
        page,
        limit,
        orderBy,
        orderDir,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (guideId: number) => {
      // TODO: Add delete guide action
      return Promise.resolve()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guides'] })
      setDeleteModal({ open: false, guide: null })
      setDeleteError(null)
    },
    onError: (error: any) => {
      setDeleteError(error.response?.data?.message || 'Failed to delete guide')
    },
  })

  const guides = data?.data || []
  const totalPages = data?.totalPages || 1

  const handleDelete = (guide: any) => {
    setDeleteModal({ open: true, guide })
    setDeleteError(null)
  }

  const confirmDelete = () => {
    if (deleteModal.guide) {
      deleteMutation.mutate(deleteModal.guide.id)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading guides...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Error Loading Guides
          </h1>
          <p className="text-gray-400">Failed to load guides.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Guides</h1>
          <Link
            href={`/cities/${cityId}/guides/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add New Guide
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order By
              </label>
              <select
                value={orderBy}
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('orderBy', e.target.value)
                  window.location.href = url.toString()
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="createdAt">Created Date</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Direction
              </label>
              <select
                value={orderDir}
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('orderDir', e.target.value)
                  window.location.href = url.toString()
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide: any) => (
            <div
              key={guide.id}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
            >
              {guide.avatar && (
                <div className="relative h-48">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGES_URL}/${guide.avatar}`}
                    alt={guide.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div
                  className="h-10 w-10 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${imagesUrl}${guide.user.avatar})`,
                  }}
                ></div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {guide.user.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {guide.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Username:</span>
                    <span className="text-white">{guide.user.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{guide.user.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">
                      {guide.user.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price/Day:</span>
                    <span className="text-white">${guide.pricePerDay}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/cities/${cityId}/guides/edit/${guide.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(guide)}
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
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1
                const url = new URL(window.location.href)
                url.searchParams.set('page', pageNum.toString())

                return (
                  <Link
                    key={pageNum}
                    href={url.toString()}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
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
              <h3 className="text-xl font-bold text-white mb-4">
                Delete Guide
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{deleteModal.guide?.name}"?
                This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-400 mb-4">{deleteError}</p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, guide: null })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
