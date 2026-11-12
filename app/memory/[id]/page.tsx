'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function PublicMemoryPage() {
  const params = useParams()
  const [memory, setMemory] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const { data: memoryData, error: memoryError } = await supabase
          .from('memories')
          .select('*')
          .eq('id', params.id)
          .single()

        if (memoryError || !memoryData) {
          setError(true)
          setLoading(false)
          return
        }

        if (!memoryData.is_public) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user || user.id !== memoryData.user_id) {
            setError(true)
            setLoading(false)
            return
          }
        }

        setMemory(memoryData)

        const { data: photosData } = await supabase
          .from('memory_photos')
          .select('*')
          .eq('memory_id', params.id)
          .order('order_index', { ascending: true })

        setPhotos(photosData || [])

        await supabase
          .from('memories')
          .update({ views: (memoryData.views || 0) + 1 })
          .eq('id', params.id)

        setLoading(false)
      } catch (err) {
        setError(true)
        setLoading(false)
      }
    }

    if (params.id) fetchMemory()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] flex items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] text-2xl font-serif">✦ Loading memory...</div>
      </div>
    )
  }

  if (error || !memory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-serif text-[#C9A84C] mb-4">Memory Not Found</h1>
          <p className="text-gray-400 mb-6">This memory is private or doesn't exist.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-[#C9A84C] text-white rounded-xl hover:bg-[#b8983a] transition">← Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">✦ Memora</Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[#C9A84C] mb-2">{memory.title}</h1>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
            <span className="capitalize">{memory.category}</span>
            <span>•</span>
            <span>
              {new Date(memory.memory_date || memory.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {memory.cover_photo_url && (
          <div className="mb-6 rounded-3xl overflow-hidden shadow-2xl">
            <img src={memory.cover_photo_url} alt={memory.title} className="w-full" />
          </div>
        )}

        {memory.description && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <p className="text-gray-300 leading-relaxed">{memory.description}</p>
          </div>
        )}

        {memory.voice_message_url && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#C9A84C] mb-3">🎤 Voice Message</h3>
            <audio controls src={memory.voice_message_url} className="w-full" />
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-serif text-[#C9A84C] mb-3">📸 Photos ({photos.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="rounded-xl overflow-hidden">
                  <img src={photo.photo_url} alt="Memory" className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-gray-500 text-xs mt-8 border-t border-white/10 pt-6">
          <p>👁️ {memory.views || 0} views</p>
          <p className="mt-2">Scan the cake. Relive the memory.</p>
        </div>
      </div>
    </div>
  )
}