'use client'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { getAllMedia } from '../actions/media/getAllMedia'
import { deleteMedia } from '../actions/media/deleteMedia';

interface MediaFile {
  id: number
  bucket: string
  objectKey: string
  mime: string
  size: number
  scope: string
  ownerId: null | number
  encrypted: boolean
  uploadedAt: string
  deletedAt: null | string
  url?: string
  hasAttachment?: boolean; // Added for modal
}

interface MediaLibraryProps {
  initialPage: number
  initialLimit: number
  apiBaeUrl: string
  imagesUrl: string
}

export default function MediaLibrary({
  initialPage,
  initialLimit,
  apiBaeUrl,
  imagesUrl,
}: MediaLibraryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ✅ FIX: Ensure the base URL for images has a protocol.
  const fullImagesUrl =
    imagesUrl && !imagesUrl.startsWith('http')
      ? `http://${imagesUrl}`
      : imagesUrl

  const {
    data,
    hasNextPage,
    isFetching,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: ['media', { page: initialPage, limit: initialLimit }],
    queryFn: ({ pageParam = initialPage }) =>
      getAllMedia({ page: pageParam, limit: initialLimit }),
    initialPageParam: initialPage,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const tokenResponse = await fetch('/api/auth/token')
      if (!tokenResponse.ok) {
        throw new Error('Failed to get authorization token')
      }
      const { token } = await tokenResponse.json()

      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file)
      })

      return axios.post(`${apiBaeUrl}/storage/admin/upload-public`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
          )
          setUploadProgress(percentCompleted)
        },
      })
    },
    onSuccess: () => {
      setUploadProgress(0)
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (error) => {
      console.error('Upload failed:', error)
      setUploadProgress(0)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => deleteMedia(id),
    onSuccess: () => {
      setModalOpen(false);
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const media =
    data?.pages.flatMap((page) =>
      page.files.map((file: any) => ({
        ...file,
        // ✅ FIX: Use the corrected URL variable
        url: `${fullImagesUrl}/${file.objectKey}`,
      }))
    ) || []
console.log(media)
  const currentPage = data?.pages[data.pages.length - 1]?.page || initialPage
  const totalPages = data?.pages[0]?.totalPages || 1

  const updateQueryParams = useCallback(
    (newPage: number, newLimit: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', newPage.toString())
      params.set('limit', newLimit.toString())
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadMutation.mutate(acceptedFiles)
      }
    },
    [uploadMutation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    multiple: true,
  })

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value)
    updateQueryParams(1, newLimit)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateQueryParams(newPage, initialLimit)
    }
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-900/20'
            : 'border-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        {uploadMutation.isPending ? (
          <div className="space-y-2">
            <p>Uploading... {uploadProgress}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <p>
            {isDragActive
              ? 'Drop the files here'
              : 'Drag & drop files here, or click to select files'}
          </p>
        )}
      </div>

      {isFetching ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative group w-full aspect-square border border-white/20 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors"
                onClick={() => { setSelectedImage(item); setModalOpen(true); }}
              >
                <Image
                  src={item.url || ''}
                  alt={item.objectKey}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm truncate px-2">
                    {item.objectKey.split('/').pop()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Popup */}
          {modalOpen && selectedImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={() => { setModalOpen(false); setSelectedImage(null); }}
            >
              <div
                className="bg-gray-900 rounded-lg shadow-lg flex max-w-3xl w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Left: Image */}
                <div className="flex-1 min-w-[300px] bg-black flex items-center justify-center p-4">
                  <Image
                    src={selectedImage.url || ''}
                    alt={selectedImage.objectKey}
                    width={320}
                    height={320}
                    className="object-contain max-h-[320px] max-w-full rounded-lg"
                  />
                </div>
                {/* Right: Info */}
                <div className="flex-1 p-6 flex flex-col gap-4 min-w-[300px]">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-white">{selectedImage.objectKey.split('/').pop()}</h2>
                    <button onClick={() => { setModalOpen(false); setSelectedImage(null); }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                  </div>
                  <div className="text-gray-300 text-sm">
                    <div><span className="font-semibold">URL:</span> <a href={selectedImage.url} target="_blank" rel="noopener noreferrer" className="underline break-all">{selectedImage.url}</a></div>
                    <div><span className="font-semibold">Object Key:</span> {selectedImage.objectKey}</div>
                    <div><span className="font-semibold">Has Attachment:</span> {selectedImage.hasAttachment ? 'Yes' : 'No'}</div>
                    <div><span className="font-semibold">Mime:</span> {selectedImage.mime}</div>
                    <div><span className="font-semibold">Size:</span> {selectedImage.size} bytes</div>
                    <div><span className="font-semibold">Scope:</span> {selectedImage.scope}</div>
                    <div><span className="font-semibold">Uploaded At:</span> {selectedImage.uploadedAt}</div>
                  </div>
                  {!selectedImage.hasAttachment && (
                    <button
                      onClick={() => deleteMutation.mutate(selectedImage.id)}
                      disabled={deleteMutation.isPending}
                      className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                  {deleteMutation.isError && (
                    <div className="text-red-400 mt-2">{deleteMutation.error?.message || 'Failed to delete.'}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  )
}
