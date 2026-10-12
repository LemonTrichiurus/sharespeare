'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { Media } from '@/lib/data/sharespeare'
import { cn } from '@/lib/utils'

/** Post images/videos in a grid; click an image to view it full screen. */
export function MediaGallery({ media }: { media: Media[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (media.length === 0) return null

  return (
    <>
      <div className={cn('grid gap-3', media.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3')}>
        {media.map((item) =>
          item.kind === 'video' ? (
            <video key={item.url} src={item.url} controls preload="metadata" className="w-full rounded-lg bg-black" />
          ) : (
            <button
              key={item.url}
              type="button"
              onClick={() => setOpen(item.url)}
              className={cn('relative overflow-hidden rounded-lg bg-muted', media.length === 1 ? 'aspect-[4/3]' : 'aspect-square')}
            >
              <Image
                src={item.url}
                alt=""
                fill
                sizes={media.length === 1 ? '(min-width: 768px) 768px, 100vw' : '(min-width: 768px) 256px, 50vw'}
                className={media.length === 1 ? 'object-contain' : 'object-cover transition-transform hover:scale-105'}
              />
            </button>
          ),
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(null)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}
          tabIndex={-1}
        >
          <button type="button" className="absolute right-4 top-4 text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- full-size original, no resizing wanted */}
          <img src={open} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  )
}
