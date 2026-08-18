import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface VideoPageProps {
  params: {
    id: string
  }
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !video) {
    notFound()
  }

  // Increment view count
  try {
    await supabase
      .from('videos')
      .update({ views: (video.views || 0) + 1 })
      .eq('id', params.id)
  } catch {
    // Silently fail - don't block the page if view count fails
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <Link href="/" className="text-[#C9A84C] text-sm hover:underline">
            ← Home
          </Link>
          <div className="text-[#C9A84C] text-3xl font-serif mt-4">✦ Memora</div>
        </div>

        <div className="bg-[#14141e] rounded-xl border border-[#222] p-4">
          <video
            src={video.video_url}
            controls
            autoPlay
            playsInline
            className="w-full rounded-lg aspect-video bg-[#0a0a0f]"
          />

          <div className="mt-4">
            <h1 className="text-xl font-semibold">{video.title}</h1>
            <p className="text-gray-400 text-sm mt-1">
              👁️ {video.views || 0} views
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-xs">
          <p>Scan the cake. Relive the memory.</p>
        </div>
      </div>
    </div>
  )
}