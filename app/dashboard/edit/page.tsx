'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ============================================
// FILTERS
// ============================================
const FILTERS = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.6) contrast(1.1) brightness(1.1)' },
  { id: 'cinematic', name: 'Cinematic', css: 'contrast(1.3) saturate(0.8) brightness(0.9)' },
  { id: 'vibrant', name: 'Vibrant', css: 'saturate(1.8) contrast(1.1)' },
  { id: 'romantic', name: 'Romantic', css: 'sepia(0.3) saturate(1.2) brightness(1.05)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.4) saturate(1.3) brightness(1.05)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(-10deg) saturate(1.2) brightness(1.05)' },
  { id: 'film', name: 'Film', css: 'sepia(0.2) contrast(1.2) brightness(1.1) saturate(0.9)' },
  { id: 'dreamy', name: 'Dreamy', css: 'blur(1px) brightness(1.1) saturate(1.2)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(1.5) brightness(0.8) saturate(0.9)' },
  { id: 'fade', name: 'Fade', css: 'opacity(0.85) brightness(1.1) saturate(0.8)' },
]

// ============================================
// STICKERS
// ============================================
const STICKERS = ['❤️', '✨', '🌟', '🎉', '🎂', '💕', '🌸', '🦋', '🌈', '☀️', '🌙', '⭐', '💫', '🎈', '🎁', '📸']

// ============================================
// FRAMES
// ============================================
const FRAMES = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'polaroid', name: 'Polaroid', style: '10px solid white' },
  { id: 'gold', name: 'Gold', style: '8px solid #C9A84C' },
  { id: 'black', name: 'Black', style: '8px solid #1a1a2e' },
  { id: 'pink', name: 'Pink', style: '8px solid #f8b4c8' },
]

export default function PhotoEditorPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust' | 'text' | 'stickers' | 'frames'>('filters')

  // Adjustments
  const [filter, setFilter] = useState('none')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [vignette, setVignette] = useState(0)

  // Text
  const [text, setText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(24)
  const [textPosition, setTextPosition] = useState({ x: 50, y: 80 })

  // Stickers
  const [stickers, setStickers] = useState<{ emoji: string; x: number; y: number; size: number }[]>([])

  // Frames
  const [frame, setFrame] = useState('none')

  // Transform
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const getFilterStyle = useCallback(() => {
    const selectedFilter = FILTERS.find(f => f.id === filter)
    const baseFilter = selectedFilter?.css || 'none'
    const transform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

    return {
      filter: `${baseFilter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`,
      transform,
    }
  }, [filter, brightness, contrast, saturation, blur, rotation, flipH, flipV])

  const addSticker = (emoji: string) => {
    setStickers([...stickers, { emoji, x: 50, y: 50, size: 40 }])
  }

  const removeSticker = (index: number) => {
    setStickers(stickers.filter((_, i) => i !== index))
  }

  const resetAll = () => {
    setFilter('none')
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setVignette(0)
    setText('')
    setStickers([])
    setFrame('none')
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
  }

  const handleSave = async () => {
    if (!image || !user) return
    setSaving(true)

    try {
      const canvas = document.createElement('canvas')
      const img = new Image()
      img.src = image

      await new Promise((resolve) => { img.onload = resolve })

      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const selectedFilter = FILTERS.find(f => f.id === filter)
      ctx.filter = `${selectedFilter?.css || 'none'} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2)
      ctx.restore()

      if (vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        )
        gradient.addColorStop(0, 'rgba(0,0,0,0)')
        gradient.addColorStop(1, `rgba(0,0,0,${vignette / 100})`)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      if (text) {
        ctx.font = `bold ${textSize}px Arial`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.fillText(text, (textPosition.x / 100) * canvas.width, (textPosition.y / 100) * canvas.height)
      }

      stickers.forEach((s) => {
        ctx.font = `${s.size}px Arial`
        ctx.textAlign = 'center'
        ctx.fillText(s.emoji, (s.x / 100) * canvas.width, (s.y / 100) * canvas.height)
      })

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
      })

      const fileName = `edited_${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('memories')
        .upload(`${user.id}/edited/${fileName}`, blob)

      if (error) throw error

      alert('✅ Photo saved successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save photo')
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
      <header className="border-b border-[#e8e4de] bg-white/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard/edit" className="text-[#C9A84C] hover:underline">← Edit Studio</Link>
          <h1 className="text-lg font-serif text-[#1a1a2e]">📸 Photo Editor</h1>
          <div className="flex gap-2">
            <button onClick={resetAll} className="px-3 py-2 text-sm bg-[#faf8f5] border border-[#e8e4de] rounded-lg hover:border-[#C9A84C] transition">🔄 Reset</button>
            <button onClick={handleSave} disabled={!image || saving} className="px-4 py-2 text-sm bg-[#C9A84C] text-white rounded-lg hover:bg-[#b8983a] transition disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-4">
              {image ? (
                <div className="relative flex items-center justify-center min-h-[400px] bg-[#f0ede8] rounded-xl overflow-hidden">
                  <div className="relative" style={{ maxWidth: '100%', maxHeight: '70vh' }}>
                    <img
                      src={image}
                      alt="Editing"
                      className="rounded-xl"
                      style={{ ...getFilterStyle(), maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                    />
                    {vignette > 0 && (
                      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: `radial-gradient(circle, transparent 30%, rgba(0,0,0,${vignette / 100}) 100%)` }} />
                    )}
                    {frame !== 'none' && (
                      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: FRAMES.find(f => f.id === frame)?.style }} />
                    )}
                    {text && (
                      <div className="absolute pointer-events-none" style={{ left: `${textPosition.x}%`, top: `${textPosition.y}%`, transform: 'translate(-50%, -50%)', color: textColor, fontSize: `${textSize}px`, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{text}</div>
                    )}
                    {stickers.map((s, i) => (
                      <div key={i} className="absolute pointer-events-none" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${s.size}px` }}>{s.emoji}</div>
                    ))}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="absolute top-3 right-3 px-3 py-1.5 bg-black/50 text-white rounded-lg text-sm hover:bg-black/70 transition">Change</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[#e8e4de] rounded-xl">
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-[#4a4a5e] mb-4">Upload a photo to start editing</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-[#C9A84C] text-white rounded-xl hover:bg-[#b8983a] transition">Choose Photo</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-2">
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'filters', label: 'Filters', icon: '🎨' },
                  { id: 'adjust', label: 'Adjust', icon: '⚙️' },
                  { id: 'text', label: 'Text', icon: '📝' },
                  { id: 'stickers', label: 'Stickers', icon: '😊' },
                  { id: 'frames', label: 'Frames', icon: '🖼️' },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`py-2 px-1 rounded-lg text-xs transition ${activeTab === tab.id ? 'bg-[#C9A84C] text-white' : 'text-[#4a4a5e] hover:bg-[#faf8f5]'}`}>
                    <div className="text-lg">{tab.icon}</div>
                    <div>{tab.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-4 max-h-[500px] overflow-y-auto">
              {activeTab === 'filters' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">🎨 Filters</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {FILTERS.map((f) => (
                      <button key={f.id} onClick={() => setFilter(f.id)} className={`py-2 px-1 rounded-lg text-xs transition ${filter === f.id ? 'bg-[#C9A84C] text-white' : 'bg-[#faf8f5] text-[#4a4a5e] hover:bg-[#f0ede8]'}`}>{f.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#1a1a2e]">⚙️ Adjustments</h3>
                  <div><label className="text-xs text-[#4a4a5e] mb-1 block">Brightness: {brightness}%</label><input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  <div><label className="text-xs text-[#4a4a5e] mb-1 block">Contrast: {contrast}%</label><input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  <div><label className="text-xs text-[#4a4a5e] mb-1 block">Saturation: {saturation}%</label><input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  <div><label className="text-xs text-[#4a4a5e] mb-1 block">Blur: {blur}px</label><input type="range" min="0" max="10" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  <div><label className="text-xs text-[#4a4a5e] mb-1 block">Vignette: {vignette}%</label><input type="range" min="0" max="100" value={vignette} onChange={(e) => setVignette(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  <hr className="border-[#e8e4de]" />
                  <h4 className="text-sm font-semibold text-[#1a1a2e]">🔄 Transform</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setRotation(rotation - 90)} className="py-2 bg-[#faf8f5] rounded-lg text-sm hover:bg-[#f0ede8]">↺ Rotate Left</button>
                    <button onClick={() => setRotation(rotation + 90)} className="py-2 bg-[#faf8f5] rounded-lg text-sm hover:bg-[#f0ede8]">↻ Rotate Right</button>
                    <button onClick={() => setFlipH(!flipH)} className={`py-2 rounded-lg text-sm transition ${flipH ? 'bg-[#C9A84C] text-white' : 'bg-[#faf8f5] hover:bg-[#f0ede8]'}`}>↔ Flip H</button>
                    <button onClick={() => setFlipV(!flipV)} className={`py-2 rounded-lg text-sm transition ${flipV ? 'bg-[#C9A84C] text-white' : 'bg-[#faf8f5] hover:bg-[#f0ede8]'}`}>↕ Flip V</button>
                  </div>
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#1a1a2e]">📝 Add Text</h3>
                  <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text..." className="w-full px-3 py-2 bg-[#faf8f5] border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:border-[#C9A84C]" />
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-[#4a4a5e]">Color</label><input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" /></div>
                    <div><label className="text-xs text-[#4a4a5e]">Size: {textSize}px</label><input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-[#C9A84C]" /></div>
                  </div>
                  <div><label className="text-xs text-[#4a4a5e]">Position Y: {textPosition.y}%</label><input type="range" min="0" max="100" value={textPosition.y} onChange={(e) => setTextPosition({ ...textPosition, y: Number(e.target.value) })} className="w-full accent-[#C9A84C]" /></div>
                </div>
              )}

              {activeTab === 'stickers' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">😊 Stickers</h3>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {STICKERS.map((emoji) => (
                      <button key={emoji} onClick={() => addSticker(emoji)} className="text-2xl py-2 bg-[#faf8f5] rounded-lg hover:bg-[#f0ede8] transition">{emoji}</button>
                    ))}
                  </div>
                  {stickers.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[#1a1a2e] mb-2">Added Stickers ({stickers.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {stickers.map((s, i) => (
                          <button key={i} onClick={() => removeSticker(i)} className="px-2 py-1 bg-[#faf8f5] rounded text-sm hover:bg-red-100 transition" title="Click to remove">{s.emoji}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'frames' && (
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">🖼️ Frames</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FRAMES.map((f) => (
                      <button key={f.id} onClick={() => setFrame(f.id)} className={`py-2 px-2 rounded-lg text-xs transition ${frame === f.id ? 'bg-[#C9A84C] text-white' : 'bg-[#faf8f5] text-[#4a4a5e] hover:bg-[#f0ede8]'}`}>{f.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}