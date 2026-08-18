'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [title, setTitle] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [videoLink, setVideoLink] = useState('')

  const generateId = () => {
    return Math.random().toString(36).substring(2, 8)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
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
        .from('videos')
        .insert({
          id: uniqueId,
          title: title,
          video_url: publicUrl,
          views: 0,
          created_at: new Date().toISOString()
        })

      if (dbError) throw dbError

      const link = `${window.location.origin}/video/${uniqueId}`
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-[#C9A84C] text-5xl font-serif mb-2">✦</div>
          <h1 className="text-3xl font-serif text-[#C9A84C]">Memora</h1>
          <p className="text-gray-400 text-sm mt-1">Upload video → Get link → Share</p>
        </div>

        <div className="bg-[#14141e] rounded-xl border border-[#222] p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Video Title</label>
              <input
                type="text"
                placeholder="e.g., My Birthday Video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[#C9A84C] placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Select Video</label>
              <input
                id="fileInput"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#222] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#C9A84C] file:text-black file:cursor-pointer file:font-semibold hover:file:bg-[#b8983a] transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-[#C9A84C] text-black font-semibold rounded-lg hover:bg-[#b8983a] transition disabled:opacity-50"
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload Video'}
            </button>
          </form>
        </div>

        {videoLink && (
          <div className="mt-6 bg-[#14141e] rounded-xl border border-[#C9A84C] p-4">
            <p className="text-sm text-gray-400 mb-2">✅ Your video link is ready!</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoLink}
                readOnly
                className="flex-1 px-3 py-2 bg-[#0a0a0f] border border-[#222] rounded-lg text-[#C9A84C] text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-[#C9A84C] text-black font-semibold rounded-lg hover:bg-[#b8983a] transition text-sm whitespace-nowrap"
              >
                📋 Copy
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 bg-[#1f1f2e] rounded-lg text-sm hover:bg-[#2a2a3e] transition"
              >
                🔗 Open Video
              </a>
              <button
                onClick={() => {
                  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(videoLink)}`, '_blank')
                }}
                className="flex-1 text-center px-4 py-2 bg-[#1f1f2e] rounded-lg text-sm hover:bg-[#2a2a3e] transition"
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