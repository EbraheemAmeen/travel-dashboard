'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import MediaModal from '@/app/components/MediaModal';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateCountry } from '../../actions/country/updateCountry';
import { getCountryById } from '../../actions/country/getCountryById';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
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

interface EditCountryProps {
  countryId: number;
  apiBaseUrl: string;
  imagesUrl: string;
}

const EditCountryForm = ({ countryId, apiBaseUrl, imagesUrl }: EditCountryProps) => {
  const [selectedMainImage, setSelectedMainImage] = useState<MediaFile | null>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<MediaFile[]>([]);
  const [isMainImageModalOpen, setIsMainImageModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: '',
    countryName: '',
    currency: '',
    timezone: '',
    description: '',
  });
  const [isActive, setIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch country data
  const { data: countryData, isLoading, error } = useQuery({
    queryKey: ['country', countryId],
    queryFn: () => getCountryById(countryId),
    enabled: !!countryId,
  });

  // Initialize form data when country data is loaded
  useEffect(() => {
    if (countryData) {
      setFormData({
        countryCode: countryData.code,
        countryName: countryData.name,
        currency: countryData.currency,
        timezone: countryData.timezone,
        description: countryData.description,
      });

      // Set isActive state
      setIsActive(countryData.is_active);

      // Set main image with URL
      if (countryData.mainImage) {
        const mainImageWithUrl = {
          ...countryData.mainImage,
          url: `${imagesUrl}/${countryData.mainImage.bucket}/${countryData.mainImage.objectKey}`
        };
        setSelectedMainImage(mainImageWithUrl);
      }

      // Set gallery images with URLs
      if (countryData.galleryImages && countryData.galleryImages.length > 0) {
        const galleryImagesWithUrls = countryData.galleryImages.map(image => ({
          ...image,
          url: `${imagesUrl}/${image.bucket}/${image.objectKey}`
        }));
        setSelectedGalleryImages(galleryImagesWithUrls);
      }
    }
  }, [countryData, imagesUrl]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearField = (fieldName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: '' }));
  };

  const updateCountryMutation = useMutation({
    mutationFn: ({ countryId, data }: { countryId: number; data: any }) => updateCountry(countryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      queryClient.invalidateQueries({ queryKey: ['country', countryId] });
      setErrorMessage(null);
      toast.success('Country updated successfully!');
      router.push('/countries');
    },
    onError: (error: Error) => {
      const message = error.message || 'An unknown error occurred while updating the country.';
      setErrorMessage(message);
      showErrorToast(message);
      console.error(`Error updating country: ${message}`);
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

    if (!formData.currency.trim()) {
      showErrorToast('Currency is required.');
      return;
    }

    if (formData.currency.trim().length !== 3) {
      showErrorToast('Currency must be exactly 3 letters (e.g., USD, EUR).');
      return;
    }

    if (!formData.timezone.trim()) {
      showErrorToast('Timezone is required.');
      return;
    }

    if (!formData.timezone.includes('/')) {
      showErrorToast('Timezone must be in format Continent/City (e.g., America/New_York).');
      return;
    }

    if (!formData.description.trim()) {
      showErrorToast('Description is required.');
      return;
    }

    if (!selectedMainImage) {
      showErrorToast('A main image is required.');
      return;
    }

    const payload = {
      code: formData.countryCode.toUpperCase().trim(),
      name: formData.countryName.trim(),
      currency: formData.currency.trim(),
      timezone: formData.timezone.trim(),
      description: formData.description.trim(),
      is_active: isActive ? 1 : 0,
      mainImageId: selectedMainImage.id,
      galleryImageIds: selectedGalleryImages.map((image) => image.id),
    };

    toast.dismiss();
    updateCountryMutation.mutate({ countryId, data: payload });
  };

  if (isLoading) {
    return (
      <main className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-12 min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Country</h1>
          <p className="text-gray-400">{error.message}</p>
          <button
            onClick={() => router.push('/countries')}
            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            Back to Countries
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-12 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Edit Country</h1>
    
      <div className="space-y-6 mb-8">
        <div className=' flex gap-5 justify-between' >
          <div className="relative w-1/2 space-y-2">
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

          <div className="space-y-2 w-1/2 relative">
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
        </div>
        <div className=' flex gap-5 justify-between' >
        <div className="space-y-2 w-1/2 relative">
          <label className="block text-lg font-medium">Currency</label>
          <input
            type="text"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            maxLength={3}
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. USD"
          />
          {formData.currency && (
            <button
            onClick={() => clearField('currency')}
            className="absolute right-2 top-10 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
          >
            ×
          </button>
          )}
          <p className="text-sm text-gray-400">Common currencies: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY</p>
        </div>

        <div className="space-y-2 w-1/2 relative">
          <label className="block text-lg font-medium">Timezone</label>
          <input
            type="text"
            name="timezone"
            value={formData.timezone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. America/New_York"
          />
          {formData.timezone && (
            <button
              onClick={() => clearField('timezone')}
              className="absolute right-2 top-10 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
            >
              ×
            </button>
          )}
          <p className="text-sm text-gray-400">Common timezones: America/New_York, Europe/London, Asia/Tokyo, Australia/Sydney</p>
        </div>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-lg font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 text-lg bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Enter country description..."
          />
          {formData.description && (
            <button
              onClick={() => clearField('description')}
              className="absolute right-2 bottom-2 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-lg font-medium">Status</label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isActive ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-lg text-gray-300">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {isActive 
              ? 'This country is currently active and visible to users.' 
              : 'This country is currently inactive and hidden from users.'
            }
          </p>
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
                  src={selectedMainImage.url || ''}
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
                      src={image.url || ''}
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
          onClick={() => router.push('/countries')}
          className="px-6 py-3 text-lg bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={updateCountryMutation.isPending}
          className="px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateCountryMutation.isPending ? 'Updating...' : 'Update Country'}
        </button>
      </div>

      {/* Main Image Modal */}
      <MediaModal
        isOpen={isMainImageModalOpen}
        onClose={() => setIsMainImageModalOpen(false)}
        onSelect={handleSelectMainImage}
        apiBaseUrl={apiBaseUrl}
        imagesUrl={imagesUrl}
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
        imagesUrl={imagesUrl}
        isMultiSelect={true}
        initiallySelected={selectedGalleryImages}
        currentMainImage={selectedMainImage}
      />
    </main>
  );
};

export default EditCountryForm; 