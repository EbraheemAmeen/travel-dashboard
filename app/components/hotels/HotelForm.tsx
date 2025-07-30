'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createHotel } from '@/app/actions/hotels/createHotel';
import { getHotelById } from '@/app/actions/hotels/getHotelById';
import { updateHotel } from '@/app/actions/hotels/updateHotel';
import { getCityById } from '@/app/actions/cities/getCityById';
import MediaModal from '@/app/components/MediaModal';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the entire map component to avoid SSR issues
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }
);

interface HotelFormProps {
  mode: 'add' | 'edit';
  cityId: number;
  hotelId?: number;
  apiBaseUrl: string;
  imagesUrl: string;
}

export default function HotelForm({ mode, cityId, hotelId, apiBaseUrl, imagesUrl }: HotelFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: hotel, isLoading: loadingHotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => getHotelById(hotelId!),
    enabled: mode === 'edit' && !!hotelId,
  });

  const { data: city, isLoading: loadingCity } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => getCityById(cityId),
    enabled: !!cityId,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stars, setStars] = useState<number>(3);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [currency, setCurrency] = useState('USD');
  const [mainImage, setMainImage] = useState<any | null>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([30.0444, 31.2357]);
  const [cityCenter, setCityCenter] = useState<[number, number]>([30.0444, 31.2357]);
  const [cityRadius, setCityRadius] = useState<number>(5000);
  const [mainImageModalOpen, setMainImageModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && hotel) {
      setName(hotel.name || '');
      setDescription(hotel.description || '');
      setStars(hotel.stars || 3);
      setAddress(hotel.address || '');
      setPhone(hotel.phone || '');
      setEmail(hotel.email || '');
      setCheckInTime(hotel.checkInTime || '14:00');
      setCheckOutTime(hotel.checkOutTime || '12:00');
      setCurrency(hotel.currency || 'USD');
      setMainImage(hotel.mainImage || null);
      setGalleryImages(hotel.galleryImages || []);
      console.log("hotel.location",hotel);
      if (hotel.location) {
        // Swap coordinates: API returns [lon, lat] but Leaflet expects [lat, lon]
        setCenter([hotel.location[1], hotel.location[0]]);
      }
    } else if (mode === 'add' && city && cityCenter[0] !== 30.0444) {
      // Set center to city center only in add mode and when city data is loaded
      setCenter(cityCenter);
    }
  }, [mode, hotel, city, cityCenter]);

  // Set city data for both add and edit modes
  useEffect(() => {
    if (city) {
      if (city.center) {
        // Swap coordinates: API returns [lon, lat] but Leaflet expects [lat, lon]
        const cityCenterCoords: [number, number] = [city.center[1], city.center[0]];
        setCityCenter(cityCenterCoords);
      }
      if (city.radius) {
        console.log("Setting city radius:", city.radius);
        // Convert radius from kilometers to meters for Leaflet
        setCityRadius(city.radius * 1000);
      }
    }
  }, [city]);

  const createMutation = useMutation({
    mutationFn: createHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      router.push(`/cities/${cityId}/hotels`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create hotel');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateHotel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      queryClient.invalidateQueries({ queryKey: ['hotel', hotelId] });
      router.push(`/cities/${cityId}/hotels`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update hotel');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!mainImage) {
      setError('Please select a main image');
      return;
    }

    const hotelData = {
      name,
      cityId,
      description,
      stars,
      address,
      phone,
      email,
      location: {
        lat: center[0],
        lon: center[1],
      },
      checkInTime,
      checkOutTime,
      currency,
      mainImageId: mainImage.id,
      galleryImageIds: galleryImages.map(img => img.id),
    };

    if (mode === 'add') {
      createMutation.mutate(hotelData);
    } else if (mode === 'edit' && hotelId) {
      updateMutation.mutate({ id: hotelId, data: hotelData });
    }
  };

  const handleSelectMainImage = (images: any[]) => {
    if (images.length > 0) {
      setMainImage(images[0]);
      setGalleryImages(prev => prev.filter(img => img.id !== images[0].id));
    }
    setMainImageModalOpen(false);
  };

  const handleSelectGalleryImage = (images: any[]) => {
    setGalleryImages(images);
    setGalleryModalOpen(false);
  };

  const removeGalleryImage = (imageId: number) => {
    setGalleryImages(prev => prev.filter(img => img.id !== imageId));
  };

  const loading = loadingHotel || loadingCity || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            {mode === 'add' ? 'Add New Hotel' : 'Edit Hotel'}
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loadingCity && mode === 'add' && (
          <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg mb-6">
            Loading city data...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hotel Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stars</label>
              <select
                value={stars}
                onChange={(e) => setStars(parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Check-in Time</label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Check-out Time</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Location Map */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <div className="h-64 z-0 bg-gray-800 rounded-lg overflow-hidden">
              <MapComponent
                center={center}
                cityCenter={cityCenter}
                cityRadius={cityRadius}
                onCenterChange={setCenter}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Click on the map to set the hotel location. The green circle shows the city boundaries. Coordinates: {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </p>
          </div>

          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Main Image</label>
            <div className="flex items-center gap-4">
              {mainImage && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <img
                    src={`${imagesUrl}/${mainImage.bucket}/${mainImage.objectKey}`}
                    alt="Main"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setMainImageModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {mainImage ? 'Change Image' : 'Select Image'}
              </button>
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gallery Images</label>
            <div className="flex flex-wrap gap-4 mb-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={`${imagesUrl}/${image.bucket}/${image.objectKey}`}
                    alt="Gallery"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(image.id)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                console.log("Opening gallery modal, current state:", galleryModalOpen);
                setGalleryModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Gallery Image
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Create Hotel' : 'Update Hotel'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Media Modals */}
        <MediaModal
          isOpen={mainImageModalOpen}
          onClose={() => setMainImageModalOpen(false)}
          onSelect={handleSelectMainImage}
          apiBaseUrl={apiBaseUrl}
          imagesUrl={imagesUrl}
          isMultiSelect={false}
          initiallySelected={galleryImages}
          currentMainImage={mainImage}
        />

        <MediaModal
          isOpen={galleryModalOpen}
          onClose={() => setGalleryModalOpen(false)}
          onSelect={handleSelectGalleryImage}
          apiBaseUrl={apiBaseUrl}
          imagesUrl={imagesUrl}
          isMultiSelect={true}
          initiallySelected={galleryImages}
          currentMainImage={mainImage}
        />
      </div>
    </div>
  );
} 