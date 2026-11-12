'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, CATEGORIES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateMemoryPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [memoryDate, setMemoryDate] = useState('')
  const [category, setCategory] = useState('birthday')
  const [isPublic, setIsPublic] = useState(true)
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [coverPreview, setCoverPreview] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState<Blob | null>(null)
  const [voicePreview, setVoicePreview] = useState('')

  const router = useRouter()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  // Handle cover photo
  const handleCoverPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverPhoto(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  // Handle multiple photos
  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos(files)
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setVoiceMessage(blob)
        setVoicePreview(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      alert('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const generateId = () => Math.random().toString(36).substring(2, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !user) return
    setSaving(true)

    try {
      const memoryId = generateId()

      // 1. Upload cover photo
      let coverUrl = ''
      if (coverPhoto) {
        const fileName = `cover_${Date.now()}.${coverPhoto.name.split('.').pop()}`
        const { error } = await supabase.storage
          .from('memories')
          .upload(`${user.id}/${memoryId}/${fileName}`, coverPhoto)
        if (!error) {
          const { data } = supabase.storage.from('memories').getPublicUrl(`${user.id}/${memoryId}/${fileName}`)
          coverUrl = data.publicUrl
        }
      }

      // 2. Upload voice message
      let voiceUrl = ''
      if (voiceMessage) {
        const fileName = `voice_${Date.now()}.webm`
        const { error } = await supabase.storage
          .from('memories')
          .upload(`${user.id}/${memoryId}/${fileName}`, voiceMessage)
        if (!error) {
          const { data } = supabase.storage.from('memories').getPublicUrl(`${user.id}/${memoryId}/${fileName}`)
          voiceUrl = data.publicUrl
        }
      }

      // 3. Create memory record
      const { error: memoryError } = await supabase.from('memories').insert({
        id: memoryId,
        user_id: user.id,
        title,
        description,
        memory_date: memoryDate || null,
        category,
        cover_photo_url: coverUrl,
        is_public: isPublic,
        voice_message_url: voiceUrl,
      })

      if (memoryError) throw memoryError

      // 4. Upload photos
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const fileName = `photo_${Date.now()}_${i}.${file.name.split('.').pop()}`
        const { error } = await supabase.storage
          .from('memories')
          .upload(`${user.id}/${memoryId}/${fileName}`, file)

        if (!error) {
          const { data } = supabase.storage.from('memories').getPublicUrl(`${user.id}/${memoryId}/${fileName}`)
          await supabase.from('memory_photos').insert({
            memory_id: memoryId,
            photo_url: data.publicUrl,
            order_index: i,
          })
        }
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create memory')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8] flex items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] text-2xl font-serif">✦ Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8]">
      {/* Header */}
      <header className="border-b border-[#e8e4de] bg-white/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-[#C9A84C] hover:underline">← Back</Link>
          <h1 className="text-xl font-serif text-[#1a1a2e]">Create Memory</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Memory Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Our First Anniversary"
              className="w-full px-4 py-3 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C]"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this memory..."
              rows={4}
              className="w-full px-4 py-3 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C]"
            />
          </div>

          {/* Date & Category */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Date</label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-3 rounded-xl border-2 transition ${
                      category === cat.id
                        ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                        : 'border-[#e8e4de] bg-[#faf8f5] text-[#4a4a5e] hover:border-[#C9A84C]'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Photo */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Cover Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverPhoto}
              className="w-full px-4 py-3 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#C9A84C] file:text-white file:font-semibold"
            />
            {coverPreview && (
              <img src={coverPreview} alt="Cover" className="mt-3 w-32 h-32 object-cover rounded-xl" />
            )}
          </div>

          {/* Photos */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-2">
              Photos ({photos.length}/10)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              className="w-full px-4 py-3 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#C9A84C] file:text-white file:font-semibold"
            />
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {photoPreviews.map((preview, i) => (
                  <img key={i} src={preview} alt={`Photo ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>

          {/* Voice Message */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Voice Message</label>
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 bg-[#C9A84C] text-white rounded-xl hover:bg-[#b8983a] transition"
                >
                  🎤 Record
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition animate-pulse"
                >
                  ⏹️ Stop Recording
                </button>
              )}
              {voicePreview && <audio controls src={voicePreview} className="flex-1" />}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 accent-[#C9A84C]"
              />
              <span className="text-[#1a1a2e]">Make this memory public (anyone with QR can view)</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#C9A84C] text-white font-semibold rounded-2xl hover:bg-[#b8983a] transition shadow-lg shadow-[#C9A84C]/30 disabled:opacity-50"
          >
            {saving ? '⏳ Creating...' : '✨ Create Memory'}
          </button>
        </form>
      </div>
    </div>
  )
}