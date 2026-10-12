'use client'

import { useActionState, useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/SubmitButton'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { saveShare } from '@/actions/sharespeare'
import { uploadImage } from '@/lib/upload'
import type { Tag } from '@/lib/data/sharespeare'
import { cn } from '@/lib/utils'

const MAX_IMAGES = 9

interface ShareFormProps {
  userId: string
  tags: Tag[]
  /** Present when editing an existing post. */
  initial?: { id: number; title: string; content: string; tagIds: number[]; media: string[]; isDraft: boolean }
}

export function ShareForm({ userId, tags, initial }: ShareFormProps) {
  const { t, lang } = useI18n()
  const [state, formAction] = useActionState(saveShare.bind(null, initial?.id ?? null), undefined)
  const [media, setMedia] = useState<string[]>(initial?.media ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setUploadError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, MAX_IMAGES - media.length)) {
        const url = await uploadImage(file, `sharespeare/${userId}`)
        setMedia((prev) => [...prev, url])
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'errors.upload_failed')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">{t('share.form.title')}</Label>
        <Input id="title" name="title" defaultValue={initial?.title} maxLength={200} required aria-describedby="title-error" />
        <FieldError state={state} name="title" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('share.form.tags')}</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label key={tag.id} className="cursor-pointer">
              <input type="checkbox" name="tagIds" value={tag.id} defaultChecked={initial?.tagIds.includes(tag.id)} className="peer sr-only" />
              <span className="inline-block rounded-full border px-3 py-1 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2">
                {lang === 'zh' ? tag.nameZh : tag.nameEn}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="content">{t('share.form.content')}</Label>
        <Textarea id="content" name="content" defaultValue={initial?.content} rows={14} className="font-mono text-sm" aria-describedby="content-hint content-error" />
        <p id="content-hint" className="text-xs text-muted-foreground">{t('share.form.content_hint')}</p>
        <FieldError state={state} name="content" />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">{t('share.form.media')}</span>
        <input type="hidden" name="media" value={JSON.stringify(media)} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {media.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-muted">
              <Image src={url} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => setMedia((prev) => prev.filter((u) => u !== url))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                aria-label={t('share.form.remove_image')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {media.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary',
                uploading && 'cursor-wait opacity-60',
              )}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              {uploading ? t('share.form.uploading') : t('share.form.add_images')}
            </button>
          )}
        </div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <p className="text-xs text-muted-foreground">{t('share.form.media_hint')}</p>
        {uploadError && <p className="text-sm text-destructive">{t(uploadError)}</p>}
        <FieldError state={state} name="media" />
      </div>

      <FormFeedback state={state} />

      <div className="flex flex-wrap gap-3">
        <SubmitButton name="intent" value="publish" disabled={uploading}>
          {t('share.form.publish')}
        </SubmitButton>
        {(!initial || initial.isDraft) && (
          <Button type="submit" name="intent" value="draft" variant="outline" disabled={uploading}>
            {t('share.form.save_draft')}
          </Button>
        )}
      </div>
    </form>
  )
}
