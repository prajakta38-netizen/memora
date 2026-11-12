'use client'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface VideoPageProps {
  params: {
    id: string
  }
}

export default function VideoPage({ params }: VideoPageProps) {
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 🎨 Floating Particles Animation
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
    const particleCount = 120

    const colors = ['#C9A84C', '#e8d5b5', '#f5e6c8', '#d4c4a8', '#b8983a', '#ffd700']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 6 + 2,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        opacity: Math.random() * 0.5 + 0.1,
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
        ctx.shadowBlur = 25
        ctx.fill()
        ctx.shadowBlur = 0
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fill()
      })
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            const opacity = 0.08 * (1 - dist / 200)
            ctx.strokeStyle = `rgba(201, 168, 76, ${opacity})`
            ctx.lineWidth = 0.8
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

  // Hide controls after inactivity
  const handleMouseMove = () => {
    setShowControls(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('video')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error || !data) {
          setError(true)
          setLoading(false)
          return
        }

        setVideo(data)
        setLoading(false)

        // Increment view count (silently - no display)
        await supabase
          .from('video')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', params.id)
      } catch (err) {
        setError(true)
        setLoading(false)
      }
    }

    fetchVideo()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-pulse text-[#C9A84C] text-2xl font-serif">✦ Loading...</div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-3xl font-serif text-[#C9A84C] mb-4">Video Not Found</h1>
          <p className="text-gray-400 mb-6">This memory doesn't exist or has been removed.</p>
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-[#C9A84C] text-white font-semibold rounded-xl hover:bg-[#b8983a] transition-all duration-300 shadow-lg shadow-[#C9A84C]/30"
          >
            ← Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Floating Particles Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      {/* Video Container - Full Screen */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {/* Video Player */}
        <video
          ref={videoRef}
          src={video.video_url}
          controls={showControls}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          style={{ 
            background: 'transparent',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />

        {/* Overlay - Shows title when controls are hidden */}
        {!showControls && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Title at bottom */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
              <h1 className="text-white/50 text-sm font-light tracking-wider">
                {video.title}
              </h1>
            </div>
          </div>
        )}

        {/* Top Bar with Home Button */}
        <div className={`absolute top-6 left-6 z-20 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <Link 
            href="/" 
            className="text-white/60 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          >
            ✦ Home
          </Link>
        </div>

        {/* Tap to show controls indicator */}
        <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-1000 ${showControls ? 'opacity-0' : 'opacity-40'}`}>
          <p className="text-white/20 text-xs animate-pulse">Tap to show controls</p>
        </div>
      </div>
    </div>
  )
}