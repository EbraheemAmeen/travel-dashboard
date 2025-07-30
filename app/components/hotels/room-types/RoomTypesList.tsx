'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoomTypes } from '@/app/actions/hotels/room-types/getRoomTypes';
import { deleteRoomType } from '@/app/actions/hotels/room-types/deleteRoomType';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

interface RoomTypesListProps {
  cityId: number;
  hotelId: number;
  page: number;
  limit: number;
  orderBy: 'createdAt' | 'label' | 'baseNightlyRate' | 'capacity';
  orderDir: 'asc' | 'desc';
  search: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  isActive?: boolean;
}

export default function RoomTypesList({
  cityId,
  hotelId,
  page,
  limit,
  orderBy,
  orderDir,
  search,
  minPrice,
  maxPrice,
  minCapacity,
  isActive
}: RoomTypesListProps) {
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; roomType: any | null }>({ open: false, roomType: null });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: roomTypesData, isLoading, error } = useQuery({
    queryKey: ['roomTypes', hotelId, page, limit, orderBy, orderDir, search, minPrice, maxPrice, minCapacity, isActive],
    queryFn: () => getRoomTypes({
      hotelId,
      page,
      limit,
      orderBy,
      orderDir,
      search,
      minPrice,
      maxPrice,
      minCapacity,
      isActive
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ hotelId, roomTypeId }: { hotelId: number; roomTypeId: number }) => 
      deleteRoomType(hotelId, roomTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
      setDeleteModal({ open: false, roomType: null });
      setDeleteError(null);
    },
    onError: (error: any) => {
      setDeleteError(error.response?.data?.message || 'Failed to delete room type');
    },
  });

  const roomTypes = roomTypesData?.data || [];
  const totalPages = roomTypesData?.totalPages || 1;

  const handleDelete = (roomType: any) => {
    setDeleteModal({ open: true, roomType });
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (deleteModal.roomType) {
      deleteMutation.mutate({ hotelId, roomTypeId: deleteModal.roomType.id });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading room types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Room Types</h1>
          <p className="text-gray-400">Failed to load room types.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Room Types</h1>
          <Link
            href={`/cities/${cityId}/hotels/${hotelId}/room-types/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add New Room Type
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Order By</label>
              <select
                value={orderBy}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('orderBy', e.target.value);
                  window.location.href = url.toString();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="createdAt">Created Date</option>
                <option value="label">Label</option>
                <option value="baseNightlyRate">Price</option>
                <option value="capacity">Capacity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
              <select
                value={orderDir}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('orderDir', e.target.value);
                  window.location.href = url.toString();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Capacity</label>
              <select
                value={minCapacity || ''}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value) {
                    url.searchParams.set('minCapacity', e.target.value);
                  } else {
                    url.searchParams.delete('minCapacity');
                  }
                  window.location.href = url.toString();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Any Capacity</option>
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
                <option value="3">3 People</option>
                <option value="4">4+ People</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={isActive === undefined ? '' : isActive.toString()}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === '') {
                    url.searchParams.delete('isActive');
                  } else {
                    url.searchParams.set('isActive', e.target.value);
                  }
                  window.location.href = url.toString();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search room types..."
            value={search}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set('search', e.target.value);
              } else {
                url.searchParams.delete('search');
              }
              url.searchParams.delete('page');
              window.location.href = url.toString();
            }}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
          />
        </div>

        {/* Room Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((roomType: any) => (
            <div key={roomType.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {roomType.mainImage && (
                <div className="relative h-48">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGES_URL}/${roomType.mainImage.bucket}/${roomType.mainImage.objectKey}`}
                    alt={roomType.label}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{roomType.label}</h3>
                <p className="text-gray-400 text-sm mb-4">{roomType.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{roomType.capacity} people</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Rooms:</span>
                    <span className="text-white">{roomType.totalRooms}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">${roomType.baseNightlyRate}/night</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/cities/${cityId}/hotels/${hotelId}/room-types/${roomType.id}/edit`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(roomType)}
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
                const pageNum = i + 1;
                const url = new URL(window.location.href);
                url.searchParams.set('page', pageNum.toString());
                
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
                );
              })}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Delete Room Type</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{deleteModal.roomType?.label}"? This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-400 mb-4">{deleteError}</p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, roomType: null })}
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
  );
} 