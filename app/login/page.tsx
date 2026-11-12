'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 🎨 Floating Particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { 
      x: number; 
      y: number; 
      size: number; 
      speedX: number; 
      speedY: number; 
      opacity: number;
      color: string;
    }[] = []
    const particleCount = 80
    const colors = ['#C9A84C', '#e8d5b5', '#f5e6c8', '#d4c4a8', '#b8983a']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
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
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
        
        ctx.shadowColor = p.color
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0
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
            ctx.strokeStyle = `rgba(201, 168, 76, ${0.06 * (1 - dist / 150)})`
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

  // ✅ Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkUser()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ede8] flex items-center justify-center p-4 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-[#C9A84C] text-6xl font-serif mb-3 animate-float">✦</div>
          <h1 className="text-4xl font-serif text-[#1a1a2e]">Memora</h1>
          <p className="text-[#4a4a5e] text-sm mt-1">Welcome back. Login to continue.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-[#C9A84C]/15 border border-white/60 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaabc]">📧</span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaaabc]">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-[#faf8f5] border-2 border-[#e8e4de] rounded-xl text-[#1a1a2e] focus:outline-none focus:border-[#C9A84C] focus:ring-4 focus:ring-[#C9A84C]/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 p-3 rounded-xl">
                <p className="text-red-500 text-sm flex items-center gap-2">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#C9A84C] text-white font-semibold rounded-2xl hover:bg-[#b8983a] transition-all duration-300 disabled:opacity-50 shadow-lg shadow-[#C9A84C]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? '⏳ Logging in...' : '🔐 Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8a8a9e] text-xs">Protected area. Only admins can upload videos.</p>
            <Link href="/" className="inline-block mt-3 text-[#C9A84C] text-sm hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}