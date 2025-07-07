'use client';
import { useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllMedia } from '../actions/media/getAllMedia';
import { uploadMediaFiles } from '../actions/uploadMediaFiles';

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
  url?: string;
}

interface MediaLibraryProps {
  initialPage: number;
  initialLimit: number;
  apiBaeUrl:String;
  imagesUrl:String;
}

export default function MediaLibrary({
  initialPage,
  initialLimit,
  apiBaeUrl,
  imagesUrl
}: MediaLibraryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    error: queryError,
  } = useInfiniteQuery({
    queryKey: ['media', { page: initialPage, limit: initialLimit }],
    queryFn: ({ pageParam = initialPage }) => 
      getAllMedia({ page: pageParam, limit: initialLimit }),
    initialPageParam: initialPage,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
  console.log( "media" , data)

  // Mutation for uploading media
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get token');
      }
      const { token } = await tokenResponse.json();
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      return axios.post(
        `${apiBaeUrl}/storage/admin/upload-public`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
       onSuccess: () => {
      // Invalidate queries and redirect to first page
      queryClient.invalidateQueries({ queryKey: ['media'] });
      
      // Update URL to first page
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      router.replace(`?${params.toString()}`);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    }
  });

  // Flatten all pages into a single array
  const media = data?.pages.flatMap(page => page.files.map((file: { bucket: any; objectKey: any; }) => ({
    ...file,
    url: `${imagesUrl}/${file.bucket}/${file.objectKey}`
  }))) || [];

  const currentPage = data?.pages[data.pages.length - 1]?.page || initialPage;
  const totalPages = data?.pages[0]?.totalPages || 1;

  const updateQueryParams = useCallback((newPage: number, newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('limit', newLimit.toString());
    router.replace(`?${params.toString()}`);
  }, [router, searchParams]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      await uploadMutation.mutateAsync(acceptedFiles);
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    updateQueryParams(1, newLimit);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > currentPage && hasNextPage) {
      fetchNextPage();
    }
    updateQueryParams(newPage, initialLimit);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <span></span>
        <div className="flex items-center space-x-4">
          <select
            value={initialLimit}
            onChange={handleLimitChange}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer ${
          isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        {uploadMutation.isPending ? (
          <div className="space-y-2">
            <p>Uploading... {uploadMutation?.progress || 0}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${uploadMutation?.progress || 0}%` }}
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

      {queryError && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {queryError.message}
        </div>
      )}

      {isFetching && !isFetchingNextPage ? (
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

          <div className="flex justify-between items-center">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || !hasNextPage}
              className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Next'}
            </button>
          </div>
        </>
      )}
    </>
  );
}