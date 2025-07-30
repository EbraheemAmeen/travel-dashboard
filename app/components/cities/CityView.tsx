'use client';

import { useQuery } from '@tanstack/react-query';
import { getCityById } from '@/app/actions/cities/getCityById';
import Link from 'next/link';
import Image from 'next/image';

interface CityViewProps {
  cityId: number;
}

export default function CityView({ cityId }: CityViewProps) {
  const { data: city, isLoading, error } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => getCityById(cityId),
  });

  if (isLoading) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading city information...</p>
        </div>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading City</h1>
          <p className="text-gray-400">Failed to load city information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        {/* City Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            {city.mainImage && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_IMAGES_URL}/${city.mainImage.bucket}/${city.mainImage.objectKey}`}
                  alt={city.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{city.name}</h1>
              <p className="text-gray-400 text-lg">{city.country?.name}</p>
              {city.description && (
                <p className="text-gray-300 mt-2 max-w-2xl">{city.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hotels Card */}
          <Link href={`/cities/${cityId}/hotels`}>
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Hotels</h2>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400">Manage hotels, room types, and bookings</p>
            </div>
          </Link>

          {/* Attractions Card */}
          <Link href={`/cities/${cityId}/attractions`}>
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Attractions</h2>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400">Explore tourist attractions and points of interest</p>
            </div>
          </Link>

          {/* Guides Card */}
          <Link href={`/cities/${cityId}/guides`}>
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Guides</h2>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-400">Find local guides and tour services</p>
            </div>
          </Link>
        </div>

        {/* City Details */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Location</h3>
            <p className="text-gray-400">
              {city.center?.[1]?.toFixed(4)}, {city.center?.[0]?.toFixed(4)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Radius</h3>
            <p className="text-gray-400">{city.radius} km</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Avg Meal Price</h3>
            <p className="text-gray-400">${city.avgMealPrice}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
            <span className={`px-2 py-1 rounded-full text-sm ${
              city.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {city.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 