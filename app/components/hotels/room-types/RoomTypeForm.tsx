'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createRoomType, CreateRoomTypeData } from '@/app/actions/hotels/room-types/createRoomType';
import { updateRoomType, UpdateRoomTypeData } from '@/app/actions/hotels/room-types/updateRoomType';
import { getRoomTypeById } from '@/app/actions/hotels/room-types/getRoomTypeById';
import MediaModal from '@/app/components/MediaModal';
import { showSuccsesToast } from '@/app/lib/SuccessToastUtils';
import { showErrorToast } from '@/app/lib/ErrorToastUtils';

interface MediaFile {
  id: number;
  bucket: string;
  objectKey: string;
  mime: string;
  size: number | null;
  scope: string;
  ownerId: string | null;
  encrypted: boolean;
  uploadedAt: string;
  deletedAt: string | null;
  url?: string;
}

interface RoomTypeFormProps {
  mode: 'add' | 'edit';
  hotelId: number;
  roomTypeId?: number;
  imagesUrl: string;
  apiBaseUrl: string;
}

export default function RoomTypeForm({ 
  mode, 
  hotelId, 
  roomTypeId, 
  imagesUrl, 
  apiBaseUrl 
}: RoomTypeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [totalRooms, setTotalRooms] = useState(1);
  const [baseNightlyRate, setBaseNightlyRate] = useState(0);
  const [mainImage, setMainImage] = useState<MediaFile | null>(null);
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([]);

  // Modal states
  const [showMainImageModal, setShowMainImageModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Fetch room type data for edit mode
  const { data: roomTypeData, isLoading: loadingRoomType } = useQuery({
    queryKey: ['roomType', hotelId, roomTypeId],
    queryFn: () => getRoomTypeById(hotelId, roomTypeId!),
    enabled: mode === 'edit' && !!roomTypeId,
  });

  // Create room type mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRoomTypeData) => createRoomType(hotelId, data),
    onSuccess: () => {
      showSuccsesToast('Room type created successfully!');
      queryClient.invalidateQueries({ queryKey: ['roomTypes', hotelId] });
      router.push(`/cities/${hotelId}/hotels/${hotelId}/room-types`);
    },
    onError: (error: any) => {
      showErrorToast(error.response?.data?.message || 'Failed to create room type');
    },
  });

  // Update room type mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoomTypeData) => updateRoomType(hotelId, roomTypeId!, data),
    onSuccess: () => {
      showSuccsesToast('Room type updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['roomTypes', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['roomType', hotelId, roomTypeId] });
      router.push(`/cities/${hotelId}/hotels/${hotelId}/room-types`);
    },
    onError: (error: any) => {
      showErrorToast(error.response?.data?.message || 'Failed to update room type');
    },
  });

  // Pre-fill form data when room type data is loaded (edit mode)
  useEffect(() => {
    if (mode === 'edit' && roomTypeData) {
      setLabel(roomTypeData.label || '');
      setDescription(roomTypeData.description || '');
      setCapacity(roomTypeData.capacity || 1);
      setTotalRooms(roomTypeData.totalRooms || 1);
      setBaseNightlyRate(roomTypeData.baseNightlyRate || 0);
      setMainImage(roomTypeData.mainImage || null);
      setGalleryImages(roomTypeData.galleryImages || []);
    }
  }, [mode, roomTypeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainImage) {
      showErrorToast('Please select a main image');
      return;
    }

    const payload = {
      label: label.trim(),
      description: description.trim(),
      capacity,
      totalRooms,
      baseNightlyRate: parseFloat(baseNightlyRate.toString()),
      mainImageId: mainImage.id,
      galleryImageIds: galleryImages.map((image) => image.id),
    };

    if (mode === 'add') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const handleSelectMainImage = (images: MediaFile[]) => {
    if (images.length > 0) {
      setMainImage(images[0]);
    }
    setShowMainImageModal(false);
  };

  const handleSelectGalleryImages = (images: MediaFile[]) => {
    setGalleryImages(images);
    setShowGalleryModal(false);
  };

  const clearAllFields = () => {
    setLabel('');
    setDescription('');
    setCapacity(1);
    setTotalRooms(1);
    setBaseNightlyRate(0);
    setMainImage(null);
    setGalleryImages([]);
  };

  if (mode === 'edit' && loadingRoomType) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Deluxe Room, Suite"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Rooms *
              </label>
              <input
                type="number"
                value={totalRooms}
                onChange={(e) => setTotalRooms(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Nightly Rate (USD) *
              </label>
              <input
                type="number"
                value={baseNightlyRate}
                onChange={(e) => setBaseNightlyRate(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border bg-slate-900 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe the room type, amenities, and features..."
              required
            />
          </div>
        </div>

        {/* Images */}
        <div className="p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Images</h3>
          
          {/* Main Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Image *
            </label>
            <div className="flex items-center space-x-4">
              {mainImage ? (
                <div className="relative">
                  <img
                    src={`${imagesUrl}/${mainImage.bucket}/${mainImage.objectKey}`}
                    alt={mainImage.objectKey}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setMainImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowMainImageModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Select Main Image
              </button>
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Images
            </label>
            <div className="flex items-center space-x-4">
              {galleryImages.length > 0 ? (
                <div className="flex space-x-2">
                  {galleryImages.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={`${imagesUrl}/${image.bucket}/${image.objectKey}`}
                        alt={image.objectKey}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No images</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowGalleryModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Select Gallery Images
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={clearAllFields}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear All
          </button>
          <button
            type="submit"
            disabled={createMutation.status === 'pending' || updateMutation.status === 'pending'}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.status === 'pending' || updateMutation.status === 'pending' 
              ? (mode === 'add' ? 'Creating...' : 'Updating...') 
              : (mode === 'add' ? 'Create Room Type' : 'Update Room Type')
            }
          </button>
        </div>
      </form>

      {/* Main Image Modal */}
      {showMainImageModal && (
        <MediaModal
          isOpen={showMainImageModal}
          onClose={() => setShowMainImageModal(false)}
          onSelect={handleSelectMainImage}
          imagesUrl={imagesUrl}
          apiBaseUrl={apiBaseUrl}
          isMultiSelect={false}
          initiallySelected={mainImage ? [mainImage] : []}
          currentMainImage={mainImage}
        />
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <MediaModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          onSelect={handleSelectGalleryImages}
          imagesUrl={imagesUrl}
          apiBaseUrl={apiBaseUrl}
          isMultiSelect={true}
          initiallySelected={galleryImages}
          currentMainImage={null}
        />
      )}
    </div>
  );
} 