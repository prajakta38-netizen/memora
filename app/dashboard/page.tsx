'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      fetchMemories(user.id)
    }
    getUser()
  }, [])

  const fetchMemories = async (userId: string) => {
    const { data, error } = await supabase
      .from('memories')
      .select('*, memory_photos(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setMemories(data || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#C9A84C] text-2xl font-serif">✦ Memora</Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/edit"
              className="px-4 py-2 bg-white/60 border border-[#e8e4de] text-[#1a1a2e] rounded-xl hover:border-[#C9A84C] transition text-sm"
            >
              ✨ Edit Studio
            </Link>
            <Link
              href="/dashboard/create"
              className="px-4 py-2 bg-[#C9A84C] text-white rounded-xl hover:bg-[#b8983a] transition text-sm"
            >
              + New Memory
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-[#8a8a9e] hover:text-[#C9A84C] transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-serif text-[#1a1a2e]">My Memories</h1>
          <span className="text-sm text-[#8a8a9e]">{memories.length} memories</span>
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-serif text-[#1a1a2e] mb-2">No memories yet</h2>
            <p className="text-[#4a4a5e] mb-6">Create your first memory and start sharing!</p>
            <Link
              href="/dashboard/create"
              className="inline-block px-6 py-3 bg-[#C9A84C] text-white rounded-xl hover:bg-[#b8983a] transition"
            >
              ✨ Create Your First Memory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <Link key={memory.id} href={`/dashboard/memory/${memory.id}`} className="group">
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden hover:shadow-2xl hover:shadow-[#C9A84C]/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="aspect-video bg-[#f0ede8] relative">
                    {memory.cover_photo_url ? (
                      <img
                        src={memory.cover_photo_url}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">📸</div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs">
                      {memory.is_public ? '🌍 Public' : '🔒 Private'}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-sm text-[#8a8a9e] mb-2">
                      <span className="capitalize">{memory.category}</span>
                      <span>•</span>
                      <span>
                        {new Date(memory.memory_date || memory.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-[#1a1a2e] group-hover:text-[#C9A84C] transition">
                      {memory.title}
                    </h3>
                    <p className="text-[#4a4a5e] text-sm mt-1 line-clamp-2">{memory.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}