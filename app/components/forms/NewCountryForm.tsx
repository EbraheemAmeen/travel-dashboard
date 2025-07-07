'use client';
import { useState } from 'react';
import Image from 'next/image';
import MediaModal from '@/app/components/MediaModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCountry } from '../../actions/country/addCountry';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { showErrorToast } from '@/app/lib/ErrorToastUtils';


// Custom error toast with dismiss button


interface MediaFile {
  id: number;
  bucket: string;
  objectKey: string;
  mime: string;
  size: number;
  scope: string;
  ownerId: null | number;
  encrypted: boolean;
  uploadedAt: string;
  deletedAt: null | string;
  url: string;
}

interface NewCountryProps {
  apiBaseUrl: string;
}

const NewCountryForm = ({ apiBaseUrl }: NewCountryProps) => {
  const [selectedMainImage, setSelectedMainImage] = useState<MediaFile | null>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<MediaFile[]>([]);
  const [isMainImageModalOpen, setIsMainImageModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: '',
    countryName: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSelectMainImage = (images: MediaFile[]) => {
    if (images.length > 0) {
      setSelectedMainImage(images[0]);
      setSelectedGalleryImages(prev => prev.filter(img => img.id !== images[0].id));
    }
    setIsMainImageModalOpen(false);
  };

  const handleSelectGalleryImage = (images: MediaFile[]) => {
    setSelectedGalleryImages(images);
    setIsGalleryModalOpen(false);
  };

  const removeGalleryImage = (id: number) => {
    setSelectedGalleryImages(prev => prev.filter(img => img.id !== id));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearField = (fieldName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
    if (fieldName === 'countryCode') {
      setSelectedMainImage(null);
      setSelectedGalleryImages([]);
    }
  };

  const newCountryMutation = useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      setFormData({ countryCode: '', countryName: '' });
      setSelectedMainImage(null);
      setSelectedGalleryImages([]);
      setErrorMessage(null);
      toast.success('Country added successfully!');
      router.push('/countries');
    },
    onError: (error: Error) => {
      const message = error.message || 'An unknown error occurred while adding the country.';
      setErrorMessage(message);
      showErrorToast(message);
      console.error(`Error adding country: ${message}`);
    },
  });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!formData.countryCode.trim()) {
      showErrorToast('Country Code is required.');
      return;
    }

    if (formData.countryCode.trim().length !== 2) {
      showErrorToast('Country Code must be exactly 2 letters.');
      return;
    }

    if (!formData.countryName.trim()) {
      showErrorToast('Country Name is required.');
      return;
    }

    if (!selectedMainImage) {
      showErrorToast('A main image is required.');
      return;
    }

    const payload = {
      code: formData.countryCode.toUpperCase().trim(),
      name: formData.countryName.trim(),
      mainImageId: selectedMainImage.id,
      galleryImageIds: selectedGalleryImages.map((image) => image.id),
    };

    toast.dismiss();
    newCountryMutation.mutate(payload);
  };

  return (
    <main className="p-12 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">New Country</h1>

      <div className="space-y-6 mb-8">
        <div className="relative space-y-2">
          <label className="block text-lg font-medium">Country Code (2 letters)</label>
          <input
            type="text"
            name="countryCode"
            value={formData.countryCode}
            onChange={handleInputChange}
            maxLength={2}
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. US"
          />
          {formData.countryCode && (
            <button
              onClick={() => clearField('countryCode')}
              className="absolute right-2 bottom-2 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-2 relative">
          <label className="block text-lg font-medium">Country name</label>
          <input
            type="text"
            name="countryName"
            value={formData.countryName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. Syria"
          />
          {formData.countryName && (
            <button
              onClick={() => clearField('countryName')}
              className="absolute right-2 bottom-2 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium">Main Image</label>
          <button
            onClick={() => setIsMainImageModalOpen(true)}
            className="px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-lg w-full text-left"
          >
            {selectedMainImage ? `Selected: ${selectedMainImage.objectKey.split('/').pop()}` : 'Select Main Image'}
          </button>

          {selectedMainImage && (
            <div className="mt-4 flex items-center space-x-4">
              <div className="w-32 h-24 relative border-2 rounded-lg overflow-hidden">
                <Image
                  src={selectedMainImage.url}
                  alt="Selected Main"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
              <button
                onClick={() => setSelectedMainImage(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium">Gallery Images</label>
          <button
            onClick={() => setIsGalleryModalOpen(true)}
            className="px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-lg w-full text-left"
          >
            {selectedGalleryImages.length > 0
              ? `Selected: ${selectedGalleryImages.length} images`
              : 'Select Gallery Images'}
          </button>

          {selectedGalleryImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {selectedGalleryImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="w-32 h-24 relative border-2 rounded-lg overflow-hidden">
                    <Image
                      src={image.url}
                      alt="Gallery"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <button
                    onClick={() => removeGalleryImage(image.id)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <div className="mt-[100px] flex justify-between">
        <button
          onClick={() => {
            setFormData({ countryCode: '', countryName: '' });
            setSelectedMainImage(null);
            setSelectedGalleryImages([]);
          }}
          className="px-6 py-3 text-lg bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Clear All Fields
        </button>

        <button
          onClick={handleSubmit}
          disabled={newCountryMutation.isPending}
          className="px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {newCountryMutation.isPending ? 'Adding...' : 'Add New'}
        </button>
      </div>

      {/* Main Image Modal */}
      <MediaModal
        isOpen={isMainImageModalOpen}
        onClose={() => setIsMainImageModalOpen(false)}
        onSelect={handleSelectMainImage}
        apiBaseUrl={apiBaseUrl}
        isMultiSelect={false}
        initiallySelected={selectedGalleryImages}
        currentMainImage={selectedMainImage}
      />

      {/* Gallery Images Modal */}
      <MediaModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={handleSelectGalleryImage}
        apiBaseUrl={apiBaseUrl}
        isMultiSelect={true}
        initiallySelected={selectedGalleryImages}
        currentMainImage={selectedMainImage}
      />
    </main>
  );
};

export default NewCountryForm;
