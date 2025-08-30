'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCountries } from '@/app/actions/country/getCountries';
import { createCity } from '@/app/actions/cities/createCity';
import { getCityById } from '@/app/actions/cities/getCityById';
import { updateCity } from '@/app/actions/cities/updateCity';
import MediaModal from '@/app/components/MediaModal';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CityFormProps {
  mode: 'add' | 'edit';
  cityId?: number;
  imagesUrl: string;
  apiBaseUrl: string;
}

export default function CityForm({ mode, cityId, imagesUrl, apiBaseUrl }: CityFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => getCountries({ page: 1, limit: 100 }),
  });
  const { data: city, isLoading: loadingCity } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => (mode === 'edit' && cityId ? getCityById(cityId) : null),
    enabled: mode === 'edit' && !!cityId,
  });

  const [name, setName] = useState('');
  const [countryId, setCountryId] = useState<number | undefined>(undefined);
  const [mainImage, setMainImage] = useState<any | null>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [avgMealPrice, setAvgMealPrice] = useState<number | ''>('');
  const [mealPricePerPerson, setMealPricePerPerson] = useState<number | ''>('');
  const [transportRatePerKm, setTransportRatePerKm] = useState<number | ''>('');
  const [radius, setRadius] = useState<number | ''>(10);
  const [center, setCenter] = useState<[number, number]>([30.0444, 31.2357]);
  const [mainImageModalOpen, setMainImageModalOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [userMovedMarker, setUserMovedMarker] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const didMount = useRef(false);

  // Pre-fill fields in edit mode
  useEffect(() => {
    if (mode === 'edit' && city) {
      setName(city.name || '');
      setCountryId(city.countryId || undefined);
      setMainImage(city.mainImage || null);
      setGalleryImages(city.galleryImages || []);
      setDescription(city.description || '');
      setAvgMealPrice(city.avgMealPrice ? Number(city.avgMealPrice) : '');
      setMealPricePerPerson(city.cityMealPrices?.[0]?.mealPricePerPerson ? Number(city.cityMealPrices[0].mealPricePerPerson) : '');
      setTransportRatePerKm(city.distanceRates?.[0]?.transportRatePerKm ? Number(city.distanceRates[0].transportRatePerKm) : '');
      setRadius(city.radius ? Number(city.radius) : 10);
      if (city.center && Array.isArray(city.center) && city.center.length === 2) {
        setCenter([Number(city.center[0]), Number(city.center[1])]);
      }
    }
  }, [mode, city]);

  // Map interaction
  function LocationPicker() {
    useMapEvents({
      click(e) {
        setCenter([e.latlng.lat, e.latlng.lng]);
        setUserMovedMarker(true);
      },
    });
    return null;
  }

  // Debounced Nominatim search when name changes (only in add mode or if name changes in edit)
  useEffect(() => {
    if (mode === 'edit' && !didMount.current) {
      didMount.current = true;
      return; // skip geocode on first load in edit mode
    }
    if (!name) return;
    setGeocodeError(null);
    setGeocodeLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        if (userMovedMarker) return; // Don't auto-update if user moved marker
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&addressdetails=1`
        );
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          const newLat = parseFloat(result.lat);
          const newLng = parseFloat(result.lon);
          setCenter([newLat, newLng]);
          setGeocodeError(null);
        } else {
          setGeocodeError('No results found.');
        }
        setGeocodeLoading(false);
      } catch (e: any) {
        setGeocodeError('Error fetching location.');
        setGeocodeLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, userMovedMarker]);

  // Helper to auto-center map when center changes
  function MapAutoCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center);
    }, [center, map]);
    return null;
  }

  const createMutation = useMutation({
    mutationFn: (data: any) => createCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      router.push('/cities');
    },
    onError: (e: any) => setError(e.message || 'Failed to create city'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCity(cityId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.invalidateQueries({ queryKey: ['city', cityId] });
      router.push('/cities');
    },
    onError: (e: any) => setError(e.message || 'Failed to update city'),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!name || !countryId || !mainImage || !center || !radius) {
      setError('Please fill all required fields and select a location and main image.');
      return;
    }
    const payload = {
      name,
      countryId,
      mainImageId: mainImage.id,
      galleryImageIds: galleryImages.map((img) => img.id),
      location: { lat: center[0], lon: center[1] },
      description,
      avgMealPrice: avgMealPrice === '' ? undefined : Number(avgMealPrice),
      radius: radius === '' ? undefined : Number(radius),
      mealPricePerPerson: mealPricePerPerson === '' ? undefined : Number(mealPricePerPerson),
      transportRatePerKm: transportRatePerKm === '' ? undefined : Number(transportRatePerKm),
    };
    if (mode === 'add') {
      createMutation.mutate(payload);
    } else if (mode === 'edit') {
      updateMutation.mutate(payload);
    }
  };

  if (mode === 'edit' && loadingCity) {
    return <div className="p-8 min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">{mode === 'add' ? 'Add New City' : 'Edit City'}</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <label className="block mb-2 font-semibold">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required />
          <div className="flex items-center gap-2 mt-1">
            {geocodeLoading && <span className="text-xs text-gray-400">Searching...</span>}
            {geocodeError && <span className="text-xs text-red-400">{geocodeError}</span>}
          </div>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Country</label>
          <select
            value={countryId ?? ''}
            onChange={e => setCountryId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white"
            required
          >
            <option value="">Select a country</option>
            {countries && countries.data && countries.data.map((country: any) => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Main Image</label>
          <button type="button" onClick={() => setMainImageModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white">
            {mainImage ? 'Change Main Image' : 'Select Main Image'}
          </button>
          {mainImage && (
            <div className="mt-2 flex items-center gap-4">
              <img src={`${imagesUrl}/${mainImage.objectKey}`} alt="Main" className="w-24 h-16 object-cover rounded border border-gray-700" />
              <button type="button" onClick={() => setMainImage(null)} className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white">Remove</button>
            </div>
          )}
        </div>
        <div>
          <label className="block mb-2 font-semibold">Gallery Images</label>
          <button type="button" onClick={() => setGalleryModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white">
            {galleryImages.length > 0 ? `Change Gallery Images (${galleryImages.length})` : 'Select Gallery Images'}
          </button>
          {galleryImages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {galleryImages.map((img) => (
                <img key={img.id} src={`${imagesUrl}/${img.objectKey}`} alt="Gallery" className="w-16 h-12 object-cover rounded border border-gray-700" />
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Average Meal Price</label>
            <input type="number" value={avgMealPrice} onChange={e => setAvgMealPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" min={0} step={0.01} />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Meal Price Per Person</label>
            <input type="number" value={mealPricePerPerson} onChange={e => setMealPricePerPerson(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" min={0} step={0.01} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Transport Rate Per Km</label>
            <input type="number" value={transportRatePerKm} onChange={e => setTransportRatePerKm(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" min={0} step={0.01} />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Radius (km)</label>
            <input type="number" value={radius} onChange={e => setRadius(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white" min={0.1} step={0.1} />
          </div>
        </div>
        <div>
          <label className="block mb-2 font-semibold">Location (pick on map)</label>
          <div className="h-72 rounded overflow-hidden border border-gray-700">
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={center} draggable eventHandlers={{ dragend: (e) => { setCenter([e.target.getLatLng().lat, e.target.getLatLng().lng]); setUserMovedMarker(true); } }} />
              <Circle center={center} radius={Number(radius) * 1000} pathOptions={{ color: 'blue' }} />
              <LocationPicker />
              <MapAutoCenter center={center} />
            </MapContainer>
          </div>
          <div className="mt-2 text-sm text-gray-300">Lat: {center[0].toFixed(5)}, Lon: {center[1].toFixed(5)}, Radius: {radius} km</div>
        </div>
        {error && <div className="text-red-400">{error}</div>}
        <div className="flex gap-4 justify-end">
          <button type="button" className="px-4 py-2 bg-gray-700 rounded" onClick={() => router.push('/cities')}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white" disabled={createMutation.status === 'pending' || updateMutation.status === 'pending'}>
            {(createMutation.status === 'pending' || updateMutation.status === 'pending') ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
      {/* Main Image Modal */}
      {mainImageModalOpen && (
        <MediaModal
          isOpen={mainImageModalOpen}
          onClose={() => setMainImageModalOpen(false)}
          onSelect={(images) => { setMainImage(images[0]); setMainImageModalOpen(false); }}
          apiBaseUrl={apiBaseUrl}
          imagesUrl={imagesUrl}
          isMultiSelect={false}
          initiallySelected={galleryImages}
          currentMainImage={mainImage}
        />
      )}
      {/* Gallery Images Modal */}
      {galleryModalOpen && (
        <MediaModal
          isOpen={galleryModalOpen}
          onClose={() => setGalleryModalOpen(false)}
          onSelect={(images) => { setGalleryImages(images); setGalleryModalOpen(false); }}
          apiBaseUrl={apiBaseUrl}
          imagesUrl={imagesUrl}
          isMultiSelect={true}
          initiallySelected={galleryImages}
          currentMainImage={mainImage}
        />
      )}
    </main>
  );
} 