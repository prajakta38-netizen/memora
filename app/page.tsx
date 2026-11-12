'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [title, setTitle] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [videoLink, setVideoLink] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 🎨 Floating Particles Animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = []
    const particleCount = 80

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    function animate() {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity})`
        ctx.fill()
        
        ctx.shadowColor = 'rgba(201, 168, 76, 0.3)'
        ctx.shadowBlur = 15
      })
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(201, 168, 76, ${0.08 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ✅ Check session on page load - FORCE session check
  useEffect(() => {
    const getUser = async () => {
      try {
        // Check if session exists
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    getUser()

    // ✅ Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    // Force redirect to login
    router.push('/login')
  }

  const generateId = () => {
    return Math.random().toString(36).substring(2, 8)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please login first')
      router.push('/login')
      return
    }
    if (!videoFile || !title) {
      alert('Please fill in title and select a video')
      return
    }

    setUploading(true)
    setVideoLink('')

    try {
      const fileExt = videoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`public/${fileName}`, videoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(`public/${fileName}`)

      const uniqueId = generateId()

      const { error: dbError } = await supabase
        .from('video')
        .insert({
          id: uniqueId,
          title: title,
          video_url: publicUrl,
          views: 0,
          created_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      const link = `https://memora-sigma-gules.vercel.app/m/${uniqueId}`
      setVideoLink(link)

      setTitle('')
      setVideoFile(null)
      const fileInput = document.getElementById('fileInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      alert('✅ Video uploaded! Copy your link below.')

    } catch (error) {
      console.error('Upload error:', error)
      alert('❌ Failed to upload. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(videoLink)
    alert('✅ Link copied to clipboard!')
  }

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8] flex items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] text-2xl font-serif">✦ Loading...</div>
      </div>
    )
  }

  // ✅ If no user, show login page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 text-center max-w-md">
          <div className="text-[#C9A84C] text-6xl font-serif mb-4 animate-float">✦</div>
          <h1 className="text-4xl font-serif text-[#1a1a2e] mb-4">Memora</h1>
          <p className="text-[#4a4a5e] mb-8 text-lg">Please login to upload videos</p>
          <a
            href="/login"
            className="inline-block px-8 py-4 bg-[#C9A84C] text-white font-semibold rounded-2xl hover:bg-[#b8983a] transition-all duration-300 shadow-lg shadow-[#C9A84C]/30 hover:shadow-xl hover:scale-105"
          >
            🔐 Login
          </a>
        </div>
      </div>
    )
  }

  // ✅ User is logged in - show upload page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      <div className="relative z-10 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-[#C9A84C] text-5xl font-serif mb-2 animate-float">✦</div>
          <h1 className="text-4xl font-serif text-[#1a1a2e]">Memora</h1>
          <p className="text-[#4a4a5e] text-sm mt-1">Upload video → Get link → Share</p>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs text-[#8a8a9e] hover:text-[#C9A84C] transition-colors duration-300"
          >
            Logout
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#C9A84C]/10 border border-white/50 p-8">
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Video Title</label>
              <input
                type="text"
                placeholder="e.g., My Birthday Video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/20 transition-all duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Select Video</label>
              <input
                id="fileInput"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-5 py-3.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:bg-[#C9A84C] file:text-white file:font-semibold file:cursor-pointer hover:file:bg-[#b8983a] transition-all duration-300 focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/20"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-4 bg-[#C9A84C] text-white font-semibold rounded-2xl hover:bg-[#b8983a] transition-all duration-300 disabled:opacity-50 shadow-lg shadow-[#C9A84C]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload Video'}
            </button>
          </form>
        </div>

        {videoLink && (
          <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#C9A84C]/20 border border-white/50 p-6 animate-slide-up">
            <p className="text-sm text-[#4a4a5e] mb-3">✅ Your video link is ready!</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#C9A84C] text-sm focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-5 py-2.5 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#b8983a] transition-all duration-300 shadow-md shadow-[#C9A84C]/30 hover:shadow-lg"
              >
                📋 Copy
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] hover:border-[#C9A84C] transition-all duration-300"
              >
                🔗 Open Video
              </a>
              <button
                onClick={() => {
                  window.open(
                    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(videoLink)}`,
                    '_blank'
                  )
                }}
                className="flex-1 text-center px-4 py-2.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] hover:border-[#C9A84C] transition-all duration-300"
              >
                📱 Generate QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}