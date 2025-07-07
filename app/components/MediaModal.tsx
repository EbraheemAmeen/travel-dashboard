'use client';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useInView } from 'react-intersection-observer';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllMedia } from '../actions/media/getAllMedia';

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

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: MediaFile[]) => void;
  apiBaseUrl: string;
  isMultiSelect?: boolean;
  currentMainImage?: MediaFile | null;
  initiallySelected?: MediaFile[];
}

export default function MediaModal({
  isOpen,
  onClose,
  onSelect,
  apiBaseUrl,
  isMultiSelect = false,
  currentMainImage = null,
  initiallySelected = []
}: MediaModalProps) {
  const [selectedImages, setSelectedImages] = useState<MediaFile[]>(initiallySelected);
  const [tempSelectedImage, setTempSelectedImage] = useState<MediaFile | null>(null);
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImages(initiallySelected);
      setTempSelectedImage(null);
    }
  }, [isOpen, initiallySelected]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Infinite query for media
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['media'],
    queryFn: ({ pageParam = 1 }) => getAllMedia({ page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  // Filter media based on selection mode
  const filteredMedia = useMemo(() => {
    const allMedia = data?.pages.flatMap(page => 
      page.files.map((file: { bucket: any; objectKey: any; }) => ({
        ...file,
        url: `${process.env.NEXT_PUBLIC_IMAGES_URL}/${file.bucket}/${file.objectKey}`
      }))
    ) || [];

    return allMedia.filter(file => {
      // In gallery mode, exclude current main image
      if (isMultiSelect && currentMainImage) {
        return file.id !== currentMainImage.id;
      }
      // In main image mode, exclude gallery images
      if (!isMultiSelect && initiallySelected.length > 0) {
        return !initiallySelected.some(img => img.id === file.id);
      }
      return true;
    });
  }, [data, isMultiSelect, currentMainImage, initiallySelected]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) throw new Error('Failed to get token');
      const { token } = await tokenResponse.json();
      
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      return axios.post(
        `${apiBaseUrl}/storage/admin/upload-public`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  // Dropzone for uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((files: File[]) => uploadMutation.mutate(files), [uploadMutation]),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'], 'application/pdf': ['.pdf'] },
    multiple: true
  });

  const handleImageClick = (image: MediaFile) => {
    if (isMultiSelect) {
      setSelectedImages(prev => 
        prev.some(img => img.id === image.id)
          ? prev.filter(img => img.id !== image.id)
          : [...prev, image]
      );
    } else {
      setTempSelectedImage(image);
    }
  };

  const confirmSelection = () => {
    const imagesToSelect = isMultiSelect ? selectedImages : tempSelectedImage ? [tempSelectedImage] : [];
    if (imagesToSelect.length > 0) {
      onSelect(imagesToSelect);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-gray-800 p-6 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {isMultiSelect ? 'Select Gallery Images' : 'Select Main Image'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            &times;
          </button>
        </div>

        {/* Upload area */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer ${
          isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700'
        }`}>
          <input {...getInputProps()} />
          {uploadMutation.isPending ? (
            <div className="space-y-2">
              <p>Uploading... {uploadMutation.progress || 0}%</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadMutation.progress || 0}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-gray-300">
              {isDragActive ? 'Drop files here to upload' : 'Drag & drop files here, or click to select files'}
            </p>
          )}
        </div>

        {/* Media grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 flex-1 overflow-y-auto">
          {filteredMedia.map((item) => {
            const isSelected = isMultiSelect 
              ? selectedImages.some(img => img.id === item.id)
              : tempSelectedImage?.id === item.id;
            const isCurrentMainImage = currentMainImage?.id === item.id;

            return (
              <div
                key={item.id}
                className={`relative aspect-square border-2 rounded-lg cursor-pointer group transition-all ${
                  isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-transparent hover:border-gray-500'
                }`}
                onClick={() => handleImageClick(item)}
              >
                <Image
                  src={item.url || ''}
                  alt={item.objectKey}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
                
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-indigo-500' : 'bg-gray-800/80 opacity-0 group-hover:opacity-100'
                }`}>
                  {isSelected && <span className="text-white">✓</span>}
                </div>
                
                {isCurrentMainImage && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-sm text-white truncate">{item.objectKey.split('/').pop()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
          <div>
            {isMultiSelect && (
              <span className="text-gray-300">
                {selectedImages.length} {selectedImages.length === 1 ? 'item' : 'items'} selected
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmSelection}
              disabled={isMultiSelect ? selectedImages.length === 0 : !tempSelectedImage}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMultiSelect ? `Select (${selectedImages.length})` : 'Select Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}