'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createGuide } from '@/app/actions/guides/createGuide'
import { getGuideById } from '@/app/actions/guides/getGuideById'
import { updateGuide, UpdateGuideData } from '@/app/actions/guides/updateGuide'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface GuideFormProps {
  imageUrl?: string
  mode: 'add' | 'edit'
  cityId: number
  guideId?: string
}

export default function GuideForm({
  mode,
  cityId,
  guideId,
  imageUrl,
}: GuideFormProps) {
  const router = useRouter()
  const qc = useQueryClient()

  // shared state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('') // yyyy-mm-dd
  const [pricePerDay, setPricePerDay] = useState<number>(50)
  const [description, setDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  // only for “add”
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // for preview
  const [serverAvatarUrl, setServerAvatarUrl] = useState('')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')

  // ---- create mutation (unchanged) ----
  const createM = useMutation({
    mutationFn: (data: any) => createGuide(data),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ['guides'] })
      router.push(`/cities/${cityId}/guides`)
    },
    onError(e: any) {
      setError(e.response?.data?.message || 'Failed to create guide')
    },
  })

  // ---- update mutation ----
  const updateM = useMutation({
    mutationFn: (data: UpdateGuideData) => {
      if (!guideId) throw new Error('no id')
      return updateGuide(guideId, data)
    },
    onSuccess() {
      qc.invalidateQueries({ queryKey: ['guides'] })
      qc.invalidateQueries({ queryKey: ['guide', guideId] })
      router.push(`/cities/${cityId}/guides`)
    },
    onError(e: any) {
      setError(e.response?.data?.message || 'Failed to update guide')
    },
  })

  // ---- fetch for edit ----
  const { data: guide, isLoading: loadingGuide } = useQuery({
    queryKey: ['guide', guideId],
    queryFn: () =>
      mode === 'edit' && guideId ? getGuideById({ guideId }) : null,
    enabled: mode === 'edit' && !!guideId,
  })

  // ---- init form in edit ----
  useEffect(() => {
    if (mode === 'edit' && guide) {
      const u = guide?.user
      setName(u.name || '')
      setPhone(u.phone || '')
      setBirthDate(u.birthDate ? u.birthDate.slice(0, 10) : '')
      setPricePerDay(parseFloat(guide.pricePerDay))
      setDescription(guide.description || '')
      setServerAvatarUrl(`${imageUrl}${u.avatar}`)
      setAvatarFile(null)
      setAvatarPreviewUrl('')
    }
  }, [mode, guide])

  // ---- clean up preview URL ----
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  // ---- file change ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setAvatarFile(f)
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    if (f) setAvatarPreviewUrl(URL.createObjectURL(f))
    else setAvatarPreviewUrl('')
  }

  // ---- submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'add') {
      if (!avatarFile) {
        setError('Please select an avatar image')
        return
      }
      createM.mutate({
        name,
        username,
        email,
        password,
        phone,
        birthDate,
        pricePerDay,
        cityId,
        description,
        avatar: avatarFile,
      })
    } else {
      const payload: UpdateGuideData = {
        name,
        phone,
        birthDate,
        pricePerDay,
        cityId,
        description,
        // only include avatar if picked
        ...(avatarFile && { avatar: avatarFile }),
      }
      updateM.mutate(payload)
    }
  }

  if (loadingGuide && mode === 'edit') {
    return <p className="text-gray-300">Loading guide…</p>
  }

  const loading = createM?.isLoading || updateM?.isLoading

  return (
    <div className="p-12 min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {mode === 'add' ? 'Add New Guide' : 'Edit Guide'}
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* in edit mode we hide username/email/password */}
          {mode === 'add' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block mb-1 text-gray-300">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 text-gray-300">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-300">Price per day</label>
              <input
                type="number"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(parseFloat(e.target.value))}
                min="0"
                step="0.01"
                required
                className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-gray-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-300">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-gray-800 border border-gray-600 px-3 py-2 rounded"
            />
            <div className="mt-3 flex gap-4">
              {mode === 'edit' && serverAvatarUrl && !avatarPreviewUrl && (
                <Image
                  width={100}
                  height={100}
                  src={serverAvatarUrl}
                  alt="Current avatar"
                  className="h-24 w-24 object-cover rounded border"
                />
              )}
              {avatarPreviewUrl && (
                <Image
                  width={100}
                  height={100}
                  src={avatarPreviewUrl}
                  alt="New avatar preview"
                  className="h-24 w-24 object-cover rounded border"
                />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded disabled:opacity-50"
            >
              {loading
                ? 'Saving...'
                : mode === 'add'
                ? 'Create Guide'
                : 'Update Guide'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
