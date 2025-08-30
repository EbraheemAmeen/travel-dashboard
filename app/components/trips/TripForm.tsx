'use client'

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { showSuccsesToast } from '@/app/lib/SuccessToastUtils'
import { showErrorToast } from '@/app/lib/ErrorToastUtils'

// ===== actions (match your style/paths) =====
import { getAttractions } from '@/app/actions/attractions/getAttractions'
import { getTags } from '@/app/actions/attractions/getTags'
import { createTag, CreateTagData } from '@/app/actions/attractions/createTag'

import { getAvalibleGuides } from '@/app/actions/guides/getAvalibleGuides'
import { getAvailableHotels } from '@/app/actions/hotels/getAvailableHotels'
import calculateTrip from '@/app/actions/trips/calculateTrip'

// trips
import { getTrip } from '@/app/actions/trips/getTrip' // GET /trips/:id
import { createTrip } from '@/app/actions/trips/createTrip' // POST /trips
import { updateTrip } from '@/app/actions/trips/updateTrip' // PATCH /trips/:id

// ===== Media modal (you already have this) =====
import MediaModal from '@/app/components/MediaModal'

// (Optional) If you create a map w/ two markers later, we can drop it here
// const TripMap = dynamic(() => import('@/app/components/trips/TripMapComponent'), { ssr: false });

/** Types to help local state */
interface TripFormProps {
  mode: 'add' | 'edit'
  cityId: number
  tripId?: number
  imagesUrl: string
  apiBaseUrl: string
}

type TripDayPOI = { poiId: number; visitOrder: number }
type TripDay = {
  dayNumber: number
  startTime: string // HH:mm
  endTime: string // HH:mm
  description?: string
  pois: TripDayPOI[]
}

const toHhmm = (s: string) => (s.length === 5 ? s : s.slice(0, 5)) // "09:00:00" → "09:00"
const durToMinutes = (hms?: string) => {
  if (!hms) return 0
  const [h, m, s] = hms.split(':').map(Number)
  return (h || 0) * 60 + (m || 0) + Math.floor((s || 0) / 60)
}
const timeDiffMinutes = (start: string, end: string) => {
  // start/end "HH:mm"
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export default function TripForm({
  mode,
  cityId,
  tripId,
  imagesUrl,
  apiBaseUrl,
}: TripFormProps) {
  const router = useRouter()
  const qc = useQueryClient()

  // ---------- stepper ----------
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // ---------- basic info ----------
  const [name, setName] = useState('')
  const [tripType, setTripType] = useState<'PREDEFINED' | 'CUSTOM'>(
    'PREDEFINED'
  )
  const [startDate, setStartDate] = useState('') // YYYY-MM-DD
  const [endDate, setEndDate] = useState('') // YYYY-MM-DD
  const [pricePerPerson, setPricePerPerson] = useState<number>(0)
  const [minPeople, setMinPeople] = useState(1)
  const [maxPeople, setMaxPeople] = useState(10)
  const [minSeatsPerUser, setMinSeatsPerUser] = useState(1)
  const [maxSeatsPerUser, setMaxSeatsPerUser] = useState(2)
  const [withMeals, setWithMeals] = useState(false)
  const [withTransport, setWithTransport] = useState(false)
  const [hotelIncluded, setHotelIncluded] = useState(false)
  const [mealPricePerPerson, setMealPricePerPerson] = useState<number>(0)
  const [transportationPricePerPerson, setTransportationPricePerPerson] =
    useState<number>(0)

  // people / calculation
  const [peopleCount, setPeopleCount] = useState<number>(maxPeople)
  const [calculation, setCalculation] = useState<any | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [perPersonPoi, setPerPersonPoi] = useState<number | null>(null)

  // keep min/max people in sync with peopleCount (hidden inputs)
  useEffect(() => {
    setMinPeople(peopleCount)
    setMaxPeople(peopleCount)
  }, [peopleCount])

  // images
  const [mainImage, setMainImage] = useState<any | null>(null)
  const [galleryImages, setGalleryImages] = useState<any[]>([])
  const [showMainImageModal, setShowMainImageModal] = useState(false)
  const [showGalleryModal, setShowGalleryModal] = useState(false)

  // meet/drop (manual inputs for now; can be fed by hotel location automatically)
  const [meetLocationAddress, setMeetLocationAddress] = useState('')
  const [meetLocation, setMeetLocation] = useState<{
    lat: number
    lon: number
  } | null>(null)
  const [dropLocationAddress, setDropLocationAddress] = useState('')
  const [dropLocation, setDropLocation] = useState<{
    lat: number
    lon: number
  } | null>(null)

  // tags
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagDescription, setNewTagDescription] = useState('')

  // days / poi planning
  const [days, setDays] = useState<TripDay[]>([
    {
      dayNumber: 1,
      startTime: '09:00',
      endTime: '18:00',
      description: '',
      pois: [],
    },
  ])
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  // hotel selection
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null)
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(
    null
  )
  const [roomsNeeded, setRoomsNeeded] = useState<number>(1)
  const [selectedHotelLocation, setSelectedHotelLocation] = useState<
    [number, number] | null
  >(null) // [lon, lat]
  const [selectedHotelAddress, setSelectedHotelAddress] = useState<string>('')

  // guide selection
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)

  // ===== queries =====
  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => getTags(),
  })

  const { data: attractionsData } = useQuery({
    queryKey: ['attractions', cityId],
    queryFn: () => getAttractions({ cityId, page: 1, limit: 200 }),
  })

  const { data: guidesData, refetch: refetchGuides } = useQuery({
    queryKey: ['guides-available', cityId, startDate, endDate],
    queryFn: () =>
      getAvalibleGuides({
        cityId,
        startDate,
        endDate,
        page: 1,
        limit: 50,
      }),
    enabled: Boolean(cityId && startDate && endDate),
  })

  const { data: hotelsData, refetch: refetchHotels } = useQuery({
    queryKey: ['hotels-available', cityId, startDate, endDate],
    queryFn: () =>
      getAvailableHotels({
        cityId,
        startDate,
        endDate,
        page: 1,
        limit: 50,
      }),
    enabled: Boolean(hotelIncluded && cityId && startDate && endDate),
  })

  const { data: trip, isLoading: loadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId!),
    enabled: mode === 'edit' && !!tripId,
  })
  console.log('trip data', trip)
  // ===== create / update mutations =====
  const createMut = useMutation({
    mutationFn: createTrip,
    onSuccess: (res: any) => {
      showSuccsesToast('Trip created successfully!')
      qc.invalidateQueries({ queryKey: ['trips'] })
      router.push(`/cities/${cityId}/trips`)
    },
    onError: (err: any) => {
      console.log('error client', err)
      showErrorToast(err?.message || 'Failed to create trip')
    },
  })

  const calculateMut = useMutation({
    mutationFn: (data: any) => calculateTrip(data),
    onError: (err: any) => {
      showErrorToast(err?.message || 'Failed to calculate price')
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateTrip(id, data),
    onSuccess: () => {
      showSuccsesToast('Trip updated successfully!')
      qc.invalidateQueries({ queryKey: ['trips'] })
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      router.push(`/cities/${cityId}/trips`)
    },
    onError: (err: any) => {
      showErrorToast(err?.message || 'Failed to update trip')
    },
  })

  // ===== tag creation =====
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

  // ===== populate form in edit mode =====
  useEffect(() => {
    if (mode === 'edit' && trip) {
      setName(trip.name || '')
      setTripType(trip.tripType || 'PREDEFINED')
      setStartDate(trip.startDate || '')
      setEndDate(trip.endDate || '')
      setPricePerPerson(Number(trip.pricePerPerson || 0))
      setMinPeople(trip.minPeople || 1)
      setMaxPeople(trip.maxPeople || 10)
      // default people to maxPeople when editing
      setPeopleCount(trip.maxPeople || (trip.minPeople || 1))
      setMinSeatsPerUser(trip.minSeatsPerUser || 1)
      setMaxSeatsPerUser(trip.maxSeatsPerUser || 2)
      setWithMeals(Boolean(trip.withMeals))
      setWithTransport(Boolean(trip.withTransport))
      setHotelIncluded(Boolean(trip.hotelIncluded))
      setMealPricePerPerson(Number(trip.mealPricePerPerson || 0))
      setTransportationPricePerPerson(
        Number(trip.transportationPricePerPerson || 0)
      )

      // locations (trip.meetLocation {x, y}, same for drop)
      if (trip.meetLocation) {
        setMeetLocation({ lon: trip.meetLocation.x, lat: trip.meetLocation.y })
      }
      if (trip.dropLocation) {
        setDropLocation({ lon: trip.dropLocation.x, lat: trip.dropLocation.y })
      }
      setMeetLocationAddress(trip.meetLocationAdress || '')
      setDropLocationAddress(trip.dropLocationAdress || '')

      // images
      setGalleryImages(trip.galleryImages || [])
      if (trip.mainImage) setMainImage(trip.mainImage)

      // tags
      const tagIds = (trip.tripToTags || [])
        .map((t: any) => t.tag?.id)
        .filter(Boolean)
      setSelectedTagIds(tagIds)

      // hotel & room
      if (trip.tripHotels && trip.tripHotels.length > 0) {
        const th = trip.tripHotels[0]
        setSelectedHotelId(th.hotelId)
        setSelectedRoomTypeId(th.roomTypeId)
        setRoomsNeeded(th.roomsNeeded || 1)
        if (th.hotel?.address) setSelectedHotelAddress(th.hotel.address)
      }
      // guide
      if (trip.guideId) setSelectedGuideId(trip.guideId)

      // days
      const mappedDays: TripDay[] = (trip.tripDays || []).map((d: any) => ({
        dayNumber: d.dayNumber,
        startTime: toHhmm(d.startTime || '09:00:00'),
        endTime: toHhmm(d.endTime || '18:00:00'),
        description: d.description || '',
        pois: (d.tripPois || [])
          .sort((a: any, b: any) => a.visitOrder - b.visitOrder)
          .map((p: any) => ({ poiId: p.poiId, visitOrder: p.visitOrder })),
      }))
      setDays(
        mappedDays.length
          ? mappedDays
          : [
              {
                dayNumber: 1,
                startTime: '09:00',
                endTime: '18:00',
                description: '',
                pois: [],
              },
            ]
      )
      setActiveDayIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, mode])

  // ===== attractions list flatten =====
  const attractions = (attractionsData?.data as any[]) || []

  // ===== helper: day capacity checking =====
  const getPoiDuration = (poiId: number) => {
    const p = attractions.find((a) => a.id === poiId)
    return durToMinutes(p?.avgDuration)
  }
  const canAddPoiToDay = (day: TripDay, poiId: number) => {
    const windowMin = timeDiffMinutes(day.startTime, day.endTime)
    const used = day.pois.reduce((acc, p) => acc + getPoiDuration(p.poiId), 0)
    const inc = getPoiDuration(poiId)
    return used + inc <= windowMin
  }

  const addPoiToActiveDay = (poiId: number) => {
    const copy = [...days]
    const d = copy[activeDayIndex]
    if (!d) return
    if (!canAddPoiToDay(d, poiId)) {
      showErrorToast('This POI does not fit in the remaining time of the day.')
      return
    }
    const nextOrder = (d.pois[d.pois.length - 1]?.visitOrder || 0) + 1
    d.pois.push({ poiId, visitOrder: nextOrder })
    setDays(copy)
  }

  const removePoiFromDay = (dayIdx: number, idx: number) => {
    const copy = [...days]
    copy[dayIdx].pois.splice(idx, 1)
    // re-sequence visitOrder
    copy[dayIdx].pois = copy[dayIdx].pois.map((p, i) => ({
      ...p,
      visitOrder: i + 1,
    }))
    setDays(copy)
  }

  const addDay = () => {
    const nextNum = (days[days.length - 1]?.dayNumber || 0) + 1
    setDays([
      ...days,
      {
        dayNumber: nextNum,
        startTime: '09:00',
        endTime: '18:00',
        description: '',
        pois: [],
      },
    ])
  }
  const removeDay = (i: number) => {
    const copy = [...days]
    copy.splice(i, 1)
    // re-number days
    setDays(copy.map((d, idx) => ({ ...d, dayNumber: idx + 1 })))
    setActiveDayIndex(0)
  }

  // Auto-generate days based on startDate/endDate (inclusive)
  const getDaysCountInclusive = (s: string, e: string) => {
    try {
      const sd = new Date(s)
      const ed = new Date(e)
      // normalize to UTC date boundaries to avoid timezone issues
      const diffMs = ed.setHours(0, 0, 0, 0) - sd.setHours(0, 0, 0, 0)
      if (isNaN(diffMs)) return 0
      return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
    } catch (err) {
      return 0
    }
  }

  useEffect(() => {
    if (!startDate || !endDate) return
    const count = getDaysCountInclusive(startDate, endDate)
    if (count <= 0) return
    setDays((prev) => {
      const next: TripDay[] = []
      for (let i = 0; i < count; i++) {
        const dayNumber = i + 1
        const existing = prev.find((d) => d.dayNumber === dayNumber)
        next.push(
          existing || {
            dayNumber,
            startTime: '09:00',
            endTime: '18:00',
            description: '',
            pois: [],
          }
        )
      }
      // reset active day if out of range
      setActiveDayIndex((ai) => (ai >= next.length ? 0 : ai))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  // ===== hotel side-effects =====
  useEffect(() => {
    // if hotelIncluded and a hotel is chosen, default meet/drop to hotel
    if (hotelIncluded && selectedHotelLocation) {
      setMeetLocation({
        lon: selectedHotelLocation[0],
        lat: selectedHotelLocation[1],
      })
      setDropLocation({
        lon: selectedHotelLocation[0],
        lat: selectedHotelLocation[1],
      })
      if (selectedHotelAddress) {
        setMeetLocationAddress(selectedHotelAddress)
        setDropLocationAddress(selectedHotelAddress)
      }
    }
  }, [hotelIncluded, selectedHotelLocation, selectedHotelAddress])

  // ===== build payload & submit =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!mainImage) {
      showErrorToast('Please select a main image')
      return
    }
    if (!name.trim()) {
      showErrorToast('Please enter a name')
      return
    }
    if (!startDate || !endDate) {
      showErrorToast('Please select start and end dates')
      return
    }
    if (hotelIncluded) {
      if (!selectedHotelId || !selectedRoomTypeId || roomsNeeded <= 0) {
        showErrorToast('Please select a hotel, room type, and rooms needed.')
        return
      }
    } else {
      if (
        !meetLocation ||
        !dropLocation ||
        !meetLocationAddress ||
        !dropLocationAddress
      ) {
        showErrorToast('Please set meet & drop locations and addresses.')
        return
      }
    }

    const payload: any = {
      name: name.trim(),
      cityId,
      tripType,
      startDate,
      endDate,
      pricePerPerson: Number(pricePerPerson),
      minPeople,
      maxPeople,
      minSeatsPerUser,
      maxSeatsPerUser,
      withMeals,
      withTransport,
      hotelIncluded,
      mealPricePerPerson: withMeals ? Number(mealPricePerPerson) : 0,
      transportationPricePerPerson: withTransport
        ? Number(transportationPricePerPerson)
        : 0,
      guideId: selectedGuideId || undefined,

      // locations
      meetLocationAddress: meetLocationAddress || undefined,
      meetLocation: meetLocation
        ? { lat: meetLocation.lat, lon: meetLocation.lon }
        : undefined,
      dropLocationAddress: dropLocationAddress || undefined,
      dropLocation: dropLocation
        ? { lat: dropLocation.lat, lon: dropLocation.lon }
        : undefined,

      mainImageId: mainImage.id,
      galleryImageIds: galleryImages.map((g) => g.id),

      tripDays: days.map((d) => ({
        dayNumber: d.dayNumber,
        startTime: d.startTime,
        endTime: d.endTime,
        description: d.description || '',
        pois: d.pois.map((p) => ({ poiId: p.poiId, visitOrder: p.visitOrder })),
      })),

      hotels:
        hotelIncluded && selectedHotelId && selectedRoomTypeId
          ? [
              {
                hotelId: selectedHotelId,
                roomTypeId: selectedRoomTypeId,
                roomsNeeded,
              },
            ]
          : [],

      tagIds: selectedTagIds,
    }

    if (mode === 'add') {
      createMut.mutate(payload)
    } else {
      updateMut.mutate({ id: tripId!, data: payload })
    }
  }

  // ===== UI =====
  if (mode === 'edit' && loadingTrip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading trip data...</p>
        </div>
      </div>
    )
  }

  let hotels = (hotelsData?.data as any[]) || []
  let guides = (guidesData?.data as any[]) || []
  // Merge selected guide/hotel from the trip into the available lists so the UI shows reserved items
  if (mode === 'edit' && trip) {
    // Guides: ensure trip.guide is present in guides list
    try {
      const tripGuide = (trip.guide || null) as any
      if (tripGuide && !guides.find((g: any) => g.id === tripGuide.id)) {
        // push at start so it's visible
        guides = [tripGuide, ...guides]
      }
    } catch (err) {}

    // Hotels: ensure trip.tripHotels entries are merged into hotels list
    try {
      const tripHotels = trip.tripHotels || []
      tripHotels.forEach((th: any) => {
        const hId = th.hotelId
        const rtId = th.roomTypeId
        const roomsNeededInTrip = th.roomsNeeded || 0
        const existing = hotels.find((h: any) => h.hotel?.id === hId)
        if (!existing) {
          // add hotel with its roomType from trip (if provided)
          const hotelObj = th.hotel || { id: hId }
          const roomTypeObj = th.roomType
            ? { ...th.roomType }
            : { id: rtId, label: 'Reserved', capacity: 1, totalRooms: roomsNeededInTrip, baseNightlyRate: 0 }
          hotels = [{ hotel: hotelObj, roomTypes: [roomTypeObj] }, ...hotels]
        } else {
          // hotel exists in API results
          const rtExists = existing.roomTypes.find((r: any) => r.id === rtId)
          if (!rtExists) {
            // add the room type from trip
            const roomTypeObj = th.roomType ? { ...th.roomType } : { id: rtId, label: 'Reserved', capacity: 1, totalRooms: roomsNeededInTrip, baseNightlyRate: 0 }
            existing.roomTypes.push(roomTypeObj)
          } else {
            // update totalRooms to include rooms reserved in this trip so that editing won't allow overbooking
            const apiTotal = Number(rtExists.totalRooms || rtExists.totalRooms === 0 ? rtExists.totalRooms : 0)
            rtExists.totalRooms = (apiTotal || 0) + (roomsNeededInTrip || 0)
          }
        }
      })
    } catch (err) {}
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          {mode === 'add' ? 'Add New Trip' : 'Edit Trip'}
        </h1>
        <p className="text-gray-400 mt-2">
          {mode === 'add'
            ? 'Create a new trip for this city'
            : 'Update trip information and details'}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          className={`px-3 py-1 rounded ${
            step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setStep(1)}
        >
          1. Basic
        </button>
        <span className="text-gray-500">→</span>
        <button
          type="button"
          className={`px-3 py-1 rounded ${
            step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setStep(2)}
          disabled={!name || !startDate || !endDate}
        >
          2. Options & Planning
        </button>
        <span className="text-gray-500">→</span>
        <button
          type="button"
          className={`px-3 py-1 rounded ${
            step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setStep(3)}
          disabled={!name || !startDate || !endDate}
        >
          3. Price
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <>
            {/* Basic Info */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trip Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Paris Adventure Tour"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trip Type *
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PREDEFINED">PREDEFINED</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      refetchGuides()
                      if (hotelIncluded) refetchHotels()
                    }}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      refetchGuides()
                      if (hotelIncluded) refetchHotels()
                    }}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Checkout is **exclusive** (e.g. 15→16 means 1 night).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    People
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) =>
                      setPeopleCount(parseInt(e.target.value || '1'))
                    }
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* min/max people hidden and synced to peopleCount */}
                <input type="hidden" value={minPeople} />
                <input type="hidden" value={maxPeople} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min Seats/User *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={minSeatsPerUser}
                      onChange={(e) =>
                        setMinSeatsPerUser(parseInt(e.target.value || '1'))
                      }
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Seats/User *
                    </label>
                    <input
                      type="number"
                      min={minSeatsPerUser}
                      value={maxSeatsPerUser}
                      onChange={(e) =>
                        setMaxSeatsPerUser(
                          parseInt(e.target.value || String(minSeatsPerUser))
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={withMeals}
                      onChange={(e) => setWithMeals(e.target.checked)}
                    />
                    With Meals
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={withTransport}
                      onChange={(e) => setWithTransport(e.target.checked)}
                    />
                    With Transport
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={hotelIncluded}
                      onChange={(e) => {
                        setHotelIncluded(e.target.checked)
                        if (e.target.checked && startDate && endDate)
                          refetchHotels()
                      }}
                    />
                    With Hotel
                  </label>
                </div>

                {/* Meal/Transport price inputs removed from Step 1; they'll be set in Step 3 after calculation */}
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name || !startDate || !endDate || !mainImage}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Locations + Hotel / Guide */}
            <div className="bg-gray-800 p-6 rounded-lg shadow space-y-6">
              <h3 className="text-lg font-semibold text-white">Logistics</h3>

              {/* Hotels (only if included) */}
              {hotelIncluded ? (
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">
                    Available Hotels
                  </h4>
                  {!startDate || !endDate ? (
                    <p className="text-sm text-gray-400">
                      Select dates to load hotels.
                    </p>
                  ) : hotels.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No hotels available for these dates.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {hotels.map((h: any) => (
                        <div
                          key={h.hotel.id}
                          className="border border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">
                                {h.hotel.name}{' '}
                                <span className="text-sm text-gray-400">
                                  ({h.hotel.stars}★)
                                </span>
                              </p>
                              <p className="text-sm text-gray-400">
                                {h.hotel.address}
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="hotel"
                              checked={selectedHotelId === h.hotel.id}
                              onChange={() => {
                                setSelectedHotelId(h.hotel.id)
                                setSelectedHotelLocation(h.hotel.location) // [lon, lat]
                                setSelectedHotelAddress(h.hotel.address || '')
                              }}
                            />
                          </div>

                          {selectedHotelId === h.hotel.id && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Room Type
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {h.roomTypes.map((rt: any) => (
                                  <label
                                    key={rt.id}
                                    className="flex items-center gap-2 text-gray-300"
                                  >
                                    <input
                                      type="radio"
                                      name={`roomType-${h.hotel.id}`}
                                      checked={selectedRoomTypeId === rt.id}
                                      onChange={() =>
                                        setSelectedRoomTypeId(rt.id)
                                      }
                                    />
                                    <span>
                                      {rt.label} — {rt.capacity} ppl —{' '}
                                      {rt.baseNightlyRate} {h.hotel.currency}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Rooms Needed
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={roomsNeeded}
                                  onChange={(e) =>
                                    setRoomsNeeded(
                                      parseInt(e.target.value || '1')
                                    )
                                  }
                                  className="w-40 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    When a hotel is selected, meet & drop locations default to
                    the hotel.
                  </p>
                </div>
              ) : (
                // Meet/Drop manual
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meet Address *
                    </label>
                    <input
                      type="text"
                      value={meetLocationAddress}
                      onChange={(e) => setMeetLocationAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      placeholder="123 Main St..."
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Lat"
                        value={meetLocation?.lat ?? ''}
                        onChange={(e) =>
                          setMeetLocation({
                            lat: Number(e.target.value),
                            lon: meetLocation?.lon ?? 0,
                          })
                        }
                        className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Lon"
                        value={meetLocation?.lon ?? ''}
                        onChange={(e) =>
                          setMeetLocation({
                            lat: meetLocation?.lat ?? 0,
                            lon: Number(e.target.value),
                          })
                        }
                        className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Drop Address *
                    </label>
                    <input
                      type="text"
                      value={dropLocationAddress}
                      onChange={(e) => setDropLocationAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      placeholder="456 End St..."
                    />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Lat"
                        value={dropLocation?.lat ?? ''}
                        onChange={(e) =>
                          setDropLocation({
                            lat: Number(e.target.value),
                            lon: dropLocation?.lon ?? 0,
                          })
                        }
                        className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Lon"
                        value={dropLocation?.lon ?? ''}
                        onChange={(e) =>
                          setDropLocation({
                            lat: dropLocation?.lat ?? 0,
                            lon: Number(e.target.value),
                          })
                        }
                        className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guides */}
              <div className="mt-4">
                <h4 className="text-md font-semibold text-white mb-3">
                  Available Guides
                </h4>
                {!startDate || !endDate ? (
                  <p className="text-sm text-gray-400">
                    Select dates to load guides.
                  </p>
                ) : guides.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No guides available for these dates.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guides.map((g: any) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-3 border border-gray-700 rounded-lg p-3"
                      >
                        <input
                          type="radio"
                          name="guide"
                          checked={selectedGuideId === g.id}
                          onChange={() => setSelectedGuideId(g.id)}
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {g.user?.name || 'Guide'} — {g.pricePerDay} / day
                          </p>
                          <p className="text-sm text-gray-400">
                            {g.user?.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-white">Tags</h4>
                  <button
                    type="button"
                    onClick={() => setShowTagModal(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(tags || []).map((tag: any) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() =>
                          setSelectedTagIds((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Day Planner + POIs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Days */}
              <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Days Planner
                  </h3>
                  <p className="text-sm text-gray-400">Days auto-generated from start/end dates</p>
                </div>

                <div className="space-y-3">
                  {days.map((d, i) => {
                    const windowMin = timeDiffMinutes(d.startTime, d.endTime)
                    const used = d.pois.reduce(
                      (acc, p) => acc + getPoiDuration(p.poiId),
                      0
                    )
                    return (
                      <div
                        key={i}
                        className="border border-gray-700 rounded-lg"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-3"
                          onClick={() => setActiveDayIndex(i)}
                        >
                          <span className="text-white font-medium">
                            Day {d.dayNumber} — {d.startTime} → {d.endTime} (
                            {used}/{windowMin} min)
                          </span>
                          <span className="text-gray-400">
                            {activeDayIndex === i ? '▲' : '▼'}
                          </span>
                        </button>

                        {activeDayIndex === i && (
                          <div className="px-4 pb-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={d.startTime}
                                  onChange={(e) => {
                                    const copy = [...days]
                                    copy[i].startTime = toHhmm(e.target.value)
                                    setDays(copy)
                                  }}
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={d.endTime}
                                  onChange={(e) => {
                                    const copy = [...days]
                                    copy[i].endTime = toHhmm(e.target.value)
                                    setDays(copy)
                                  }}
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-gray-300 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={d.description}
                                  onChange={(e) => {
                                    const copy = [...days]
                                    copy[i].description = e.target.value
                                    setDays(copy)
                                  }}
                                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                                  placeholder="e.g., Explore city center"
                                />
                              </div>
                            </div>

                            {/* POIs in day */}
                            <div className="space-y-2">
                              {d.pois.length === 0 ? (
                                <p className="text-sm text-gray-400">
                                  No POIs added yet.
                                </p>
                              ) : (
                                d.pois.map((p, idx) => {
                                  const poi = attractions.find(
                                    (a) => a.id === p.poiId
                                  )
                                  return (
                                    <div
                                      key={`${p.poiId}-${idx}`}
                                      className="flex items-center justify-between border border-gray-700 rounded p-2"
                                    >
                                      <div>
                                        <p className="text-white text-sm font-medium">
                                          #{p.visitOrder} —{' '}
                                          {poi?.name || `POI ${p.poiId}`}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          Duration:{' '}
                                          {poi?.avgDuration || '00:00:00'}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removePoiFromDay(i, idx)}
                                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )
                                })
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right: POIs list */}
              <div className="bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  City Attractions
                </h3>
                <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                  {attractions.map((a) => (
                    <div
                      key={a.id}
                      className="border border-gray-700 rounded-lg p-3"
                    >
                      <p className="text-white font-medium">{a.name}</p>
                      <p className="text-xs text-gray-400">
                        Duration: {a.avgDuration || '00:00:00'}
                      </p>
                      <button
                        type="button"
                        onClick={() => addPoiToActiveDay(a.id)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add to Day {days[activeDayIndex]?.dayNumber ?? 1}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-500 text-white rounded-md hover:bg-gray-700"
              >
                Back
              </button>
              <div>
              <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-white">Price</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price per Person</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pricePerPerson}
                    onChange={(e) => setPricePerPerson(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">People</label>
                  <input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(parseInt(e.target.value || '1'))}
                    className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    // build calculate payload
                    const payload: any = {
                      cityId,
                      startDate,
                      endDate,
                      people: peopleCount,
                      withMeals,
                      withTransport,
                      hotelIncluded,
                      includeGuide: Boolean(selectedGuideId),
                      guideId: selectedGuideId || undefined,
                      meetLocation: meetLocation
                        ? { locationAddress: meetLocationAddress, lon: meetLocation.lon, lat: meetLocation.lat }
                        : meetLocationAddress
                        ? { locationAddress: meetLocationAddress, lon: 0, lat: 0 }
                        : undefined,
                      dropLocation: dropLocation
                        ? { locationAddress: dropLocationAddress, lon: dropLocation.lon, lat: dropLocation.lat }
                        : dropLocationAddress
                        ? { locationAddress: dropLocationAddress, lon: 0, lat: 0 }
                        : undefined,
                      pois: days.flatMap((d) => d.pois.map((p) => ({ poiId: p.poiId, dayNumber: d.dayNumber, visitOrder: p.visitOrder })) ),
                    }
                    if (hotelIncluded && selectedHotelId && selectedRoomTypeId) {
                      payload.hotels = [ { hotelId: selectedHotelId, roomTypeId: selectedRoomTypeId, roomsRequested: roomsNeeded } ]
                    }
                    try {
                      setCalculating(true)
                      const res = await calculateMut.mutateAsync(payload)
                      setCalculation(res)
                      // apply suggested perPerson and components to form
                      if (res?.perPerson) setPricePerPerson(Number(res.perPerson))
                      if (res?.perPersonMeals) setMealPricePerPerson(Number(res.perPersonMeals))
                      if (res?.perPersonTransport) setTransportationPricePerPerson(Number(res.perPersonTransport))
                      if (res?.perPersonPoi) setPerPersonPoi(Number(res.perPersonPoi))
                      // remain on step 3 so user can review and then Create
                    } catch (err) {
                      // error toast handled in mutation
                    } finally {
                      setCalculating(false)
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {calculating ? 'Calculating...' : 'Calculate'}
              </button>
              </div>

              {calculation && (
                <div className="mt-4 bg-gray-900 p-4 rounded">
                  <p className="text-white">Total: {calculation.total}</p>
                  <p className="text-white">Per Person: {calculation.perPerson}</p>
                  <p className="text-gray-400">Nights: {calculation.nights}</p>
                  <p className="text-gray-400">Distance Km: {calculation.distanceKm}</p>
                  <div className="text-sm text-gray-300 mt-2">
                    <p>Breakdown:</p>
                    <ul className="list-disc list-inside">
                      {calculation.breakdown && Object.entries(calculation.breakdown).map(([k,v]) => (
                        <li key={k}>{k}: {String(v)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-2 border border-gray-500 text-white rounded-md hover:bg-gray-700">Back</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Trip</button>
            </div>
          </>
        )}
      </form>

      {/* Main Image Modal */}
      {showMainImageModal && (
        <MediaModal
          isOpen={showMainImageModal}
          onClose={() => setShowMainImageModal(false)}
          onSelect={(images: any[]) => {
            if (images.length) setMainImage(images[0])
            setShowMainImageModal(false)
          }}
          imagesUrl={imagesUrl}
          apiBaseUrl={apiBaseUrl}
          isMultiSelect={false}
          initiallySelected={mainImage ? ([mainImage] as any) : []}
          currentMainImage={mainImage as any}
        />
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
        <MediaModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          onSelect={(images: any[]) => {
            setGalleryImages(images)
            setShowGalleryModal(false)
          }}
          imagesUrl={imagesUrl}
          apiBaseUrl={apiBaseUrl}
          isMultiSelect
          initiallySelected={galleryImages as any}
          currentMainImage={null}
        />
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-white">Add New Tag</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newTagName.trim() && newTagDescription.trim()) {
                  createTagMutation.mutate({
                    name: newTagName.trim(),
                    description: newTagDescription.trim(),
                  })
                }
              }}
              className="space-y-4"
            >
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
