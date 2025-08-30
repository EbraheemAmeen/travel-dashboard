'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  createAttraction,
  CreateAttractionData,
} from '@/app/actions/attractions/createAttraction'
import { getAttractionById } from '@/app/actions/attractions/getAttractionById'
import {
  updateAttraction,
  UpdateAttractionData,
} from '@/app/actions/attractions/updateAttraction'
import { getPoiTypes } from '@/app/actions/attractions/getPoiTypes'
import {
  createPoiType,
  CreatePoiTypeData,
} from '@/app/actions/attractions/createPoiType'
import { getTags } from '@/app/actions/attractions/getTags'
import { createTag, CreateTagData } from '@/app/actions/attractions/createTag'
import { getCityById } from '@/app/actions/cities/getCityById'
import MediaModal from '@/app/components/MediaModal'
import { showSuccsesToast } from '@/app/lib/SuccessToastUtils'
import { showErrorToast } from '@/app/lib/ErrorToastUtils'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Dynamic import for map component to avoid SSR issues
const MapComponent = dynamic(
  () => import('@/app/components/attractions/AttractionMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    ),
  }
)

interface MediaFile {
  id: number
  bucket: string
  objectKey: string
  mime: string
  size: number | null
  scope: string
  ownerId: string | null
  encrypted: boolean
  uploadedAt: string
  deletedAt: string | null
  url?: string
}

interface AttractionFormProps {
  mode: 'add' | 'edit'
  cityId: number
  attractionId?: number
  imagesUrl: string
  apiBaseUrl: string
}

export default function AttractionForm({
  mode,
  cityId,
  attractionId,
  imagesUrl,
  apiBaseUrl,
}: AttractionFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [price, setPrice] = useState(0)
  const [discountPrice, setDiscountPrice] = useState(0)
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [avgDuration, setAvgDuration] = useState(2)
  const [isActive, setIsActive] = useState(true)
  const [poiTypeId, setPoiTypeId] = useState<number | ''>('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [mainImage, setMainImage] = useState<MediaFile | null>(null)
  const [galleryImages, setGalleryImages] = useState<MediaFile[]>([])
  const [location, setLocation] = useState<[number, number]>([0, 0])

  // Modal states
  const [showMainImageModal, setShowMainImageModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showPoiTypeModal, setShowPoiTypeModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)

  // POI Type form state
  const [newPoiTypeName, setNewPoiTypeName] = useState('')
  const [newPoiTypeDescription, setNewPoiTypeDescription] = useState('')

  // Tag form state
  const [newTagName, setNewTagName] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')

  // Fetch data
  const { data: city } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => getCityById(cityId),
  })

  const { data: attraction, isLoading: isLoadingAttraction } = useQuery({
    queryKey: ['attraction', attractionId],
    queryFn: () => getAttractionById(attractionId!),
    enabled: mode === 'edit' && !!attractionId,
  })
  console.log(attraction)
  const { data: poiTypes, refetch: refetchPoiTypes } = useQuery({
    queryKey: ['poiTypes'],
    queryFn: () => getPoiTypes(),
  })

  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAttraction,
    onSuccess: () => {
      showSuccsesToast('Attraction created successfully!')
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      router.push(`/cities/${cityId}/attractions`)
    },
    onError: (error) => {
      showErrorToast('Failed to create attraction')
      console.error('Error creating attraction:', error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttractionData }) =>
      updateAttraction(id, data),
    onSuccess: () => {
      showSuccsesToast('Attraction updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['attractions'] })
      queryClient.invalidateQueries({ queryKey: ['attraction', attractionId] })
      router.push(`/cities/${cityId}/attractions`)
    },
    onError: (error) => {
      showErrorToast('Failed to update attraction')
      console.error('Error updating attraction:', error)
    },
  })

  const createPoiTypeMutation = useMutation({
    mutationFn: (data: CreatePoiTypeData) => createPoiType(data),
    onSuccess: () => {
      showSuccsesToast('POI Type created successfully!')
      refetchPoiTypes()
      setShowPoiTypeModal(false)
      setNewPoiTypeName('')
      setNewPoiTypeDescription('')
    },
    onError: (error: any) => {
      showErrorToast(
        error.response?.data?.message || 'Failed to create POI Type'
      )
    },
  })

  const createTagMutation = useMutation({
    mutationFn: (data: CreateTagData) => createTag(data),
    onSuccess: () => {
      showSuccsesToast('Tag created successfully!')
      refetchTags()
      setShowTagModal(false)
      setNewTagName('')
      setNewTagDescription('')
    },
    onError: (error: any) => {
      showErrorToast(error.response?.data?.message || 'Failed to create tag')
    },
  })

  // Populate form data when attraction is loaded (edit mode)
useEffect(() => {
  if (mode === 'edit' && attraction) {
    setName(attraction.name || '')
    setDescription(attraction.description || '')
    setAddress(attraction.address || '')
    setWebsite(attraction.website || '')
    setPrice(attraction.price || 0)
    setDiscountPrice(attraction.discountPrice || 0)
    setContactEmail(attraction.contactEmail || '')
    setPhone(attraction.phone || '')
    setOpeningHours(attraction.openingHours || '')

    // Convert duration from HH:MM:SS to hours
    const durationParts = attraction.avgDuration?.split(':') || ['0', '0', '0']
    const hours = parseInt(durationParts[0]) + parseInt(durationParts[1]) / 60
    setAvgDuration(hours)

    setIsActive(attraction.is_active || true)
    setPoiTypeId(attraction.poiTypeId || '')
    setSelectedTagIds(attraction.tags?.map((tag) => tag.id) || [])
    setMainImage(attraction?.mainImage || null)
    setGalleryImages(attraction?.galleryImages || [])

    // ✅ FIX: handle PostGIS-style location object
    if (attraction.location && attraction.location?.x && attraction.location?.y) {
      setLocation([attraction.location?.y, attraction.location?.x]) // [lat, lon]
    } else if (city?.center) {
      setLocation([city.center[1], city.center[0]])
    }
  }
}, [attraction, mode, city])

  // Set default location when city is loaded (add mode)
  useEffect(() => {
    if (
      mode === 'add' &&
      city?.center &&
      location[0] === 0 &&
      location[1] === 0
    ) {
      setLocation([city.center[1], city.center[0]])
    }
  }, [city, mode, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mainImage) {
      showErrorToast('Please select a main image')
      return
    }

    if (mode === 'add') {
      const payload: CreateAttractionData = {
        name: name.trim(),
        cityId,
        poiTypeId: Number(poiTypeId),
        description: description.trim(),
        address: address.trim(),
        location: [location[1], location[0]], // Swap back to [lon, lat] for API
        website: website.trim() || undefined,
        price: parseFloat(price.toString()),
        discountPrice:
          discountPrice > 0 ? parseFloat(discountPrice.toString()) : undefined,
        contactEmail: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        openingHours: openingHours.trim() || undefined,
        avgDuration: `${Math.floor(avgDuration)
          .toString()
          .padStart(2, '0')}:${Math.floor((avgDuration % 1) * 60)
          .toString()
          .padStart(2, '0')}:00`,
        isActive,
        mainImageId: mainImage.id,
        galleryImageIds: galleryImages.map((image) => image.id),
        tagIds: selectedTagIds,
      }

      createMutation.mutate(payload)
    } else {
      const payload: UpdateAttractionData = {
        name: name.trim(),
        poiTypeId: Number(poiTypeId),
        description: description.trim(),
        address: address.trim(),
        location: [location[1], location[0]], // Swap back to [lon, lat] for API
        website: website.trim() || undefined,
        price: parseFloat(price.toString()),
        discountPrice:
          discountPrice > 0 ? parseFloat(discountPrice.toString()) : undefined,
        contactEmail: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
        openingHours: openingHours.trim() || undefined,
        avgDuration: `${Math.floor(avgDuration)
          .toString()
          .padStart(2, '0')}:${Math.floor((avgDuration % 1) * 60)
          .toString()
          .padStart(2, '0')}:00`,
        isActive,
        mainImageId: mainImage.id,
        galleryImageIds: galleryImages.map((image) => image.id),
        tagIds: selectedTagIds,
      }

      updateMutation.mutate({ id: attractionId!, data: payload })
    }
  }

  const handleSelectMainImage = (images: MediaFile[]) => {
    if (images.length > 0) {
      setMainImage(images[0])
    }
    setShowMainImageModal(false)
  }

  const handleSelectGalleryImages = (images: MediaFile[]) => {
    setGalleryImages(images)
    setShowGalleryModal(false)
  }

  const handleCreatePoiType = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPoiTypeName.trim() && newPoiTypeDescription.trim()) {
      createPoiTypeMutation.mutate({
        name: newPoiTypeName.trim(),
        description: newPoiTypeDescription.trim(),
      })
    }
  }

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTagName.trim() && newTagDescription.trim()) {
      createTagMutation.mutate({
        name: newTagName.trim(),
        description: newTagDescription.trim(),
      })
    }
  }

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const clearAllFields = () => {
    setName('')
    setDescription('')
    setAddress('')
    setWebsite('')
    setPrice(0)
    setDiscountPrice(0)
    setContactEmail('')
    setPhone('')
    setOpeningHours('')
    setAvgDuration(2)
    setIsActive(true)
    setPoiTypeId('')
    setSelectedTagIds([])
    setMainImage(null)
    setGalleryImages([])
    if (city?.center) {
      setLocation([city.center[1], city.center[0]])
    }
  }

  if (mode === 'edit' && isLoadingAttraction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading attraction data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          {mode === 'add' ? 'Add New Attraction' : 'Edit Attraction'}
        </h1>
        <p className="text-gray-400 mt-2">
          {mode === 'add'
            ? 'Create a new attraction for this city'
            : 'Update attraction information and details'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attraction Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Louvre Museum"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                POI Type *
              </label>
              <div className="flex gap-2">
                <select
                  value={poiTypeId}
                  onChange={(e) =>
                    setPoiTypeId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select POI Type</option>
                  {poiTypes?.map((poiType: any) => (
                    <option key={poiType.id} value={poiType.id}>
                      {poiType.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowPoiTypeModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Add New
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount Price (USD)
              </label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Average Duration (Hours) *
              </label>
              <input
                type="number"
                value={avgDuration}
                onChange={(e) => setAvgDuration(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.5"
                placeholder="e.g., 2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                />
                <label className="ml-2 text-sm text-gray-300">Active</label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe the attraction, its history, and what visitors can expect..."
              required
            />
          </div>
        </div>

        {/* Contact & Details */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Contact & Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Opening Hours
            </label>
            <textarea
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Monday: Closed, Tuesday-Sunday: 9:00 AM - 6:00 PM"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">Tags</h3>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowTagModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add New Tag
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tags?.map((tag: any) => (
              <label
                key={tag.id}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
                />
                <span className="text-sm text-gray-300">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Map */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">Location</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">
              Click on the map to set the attraction location. The green circle
              shows the city boundaries.
            </p>
            <p className="text-sm text-gray-500">
              Coordinates: {location[0]?.toFixed(4) || '0.0000'},{' '}
              {location[1]?.toFixed(4) || '0.0000'}
            </p>
          </div>
          <div className="h-96 rounded-lg overflow-hidden z-[1]">
            <MapComponent
              center={location}
              cityCenter={
                city?.center
                  ? [city.center[1], city.center[0]]
                  : [30.0444, 31.2357]
              }
              cityRadius={city?.radius ? city.radius * 1000 : 25000}
              onLocationChange={setLocation}
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-white">Images</h3>

          {/* Main Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Main Image *
            </label>
            <div className="flex items-center space-x-4">
              {mainImage ? (
                <div className="relative">
                  <Image
                    width={100}
                    height={100}
                    src={`${imagesUrl}/${mainImage.objectKey}`}
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
                <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gallery Images
            </label>
            <div className="flex items-center space-x-4">
              {galleryImages.length > 0 ? (
                <div className="flex space-x-2">
                  {galleryImages.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={`${imagesUrl}/${image.objectKey}`}
                        alt={image.objectKey}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryImages(
                            galleryImages.filter((_, i) => i !== index)
                          )
                        }
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
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
            disabled={
              createMutation.status === 'pending' ||
              updateMutation.status === 'pending'
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.status === 'pending' ||
            updateMutation.status === 'pending'
              ? 'Saving...'
              : mode === 'add'
              ? 'Create Attraction'
              : 'Update Attraction'}
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

      {/* POI Type Modal */}
      {showPoiTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-white">
              Add New POI Type
            </h3>
            <form onSubmit={handleCreatePoiType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newPoiTypeName}
                  onChange={(e) => setNewPoiTypeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Museum"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newPoiTypeDescription}
                  onChange={(e) => setNewPoiTypeDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this POI type..."
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPoiTypeModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPoiTypeMutation.status === 'pending'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createPoiTypeMutation.status === 'pending'
                    ? 'Creating...'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-white">Add New Tag</h3>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Historical"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this tag..."
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTagMutation.status === 'pending'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createTagMutation.status === 'pending'
                    ? 'Creating...'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
