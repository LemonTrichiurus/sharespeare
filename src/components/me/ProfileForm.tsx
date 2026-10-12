'use client'

import { useActionState, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/SubmitButton'
import { UserAvatar } from '@/components/UserAvatar'
import { FieldError, FormFeedback } from '@/components/FormFeedback'
import { useI18n } from '@/contexts/I18nContext'
import { updateProfile } from '@/actions/auth'
import { uploadImage } from '@/lib/upload'

export function ProfileForm({ userId, displayName, avatarUrl }: { userId: string; displayName: string | null; avatarUrl: string | null }) {
  const { t } = useI18n()
  const [state, formAction] = useActionState(updateProfile, undefined)
  const [avatar, setAvatar] = useState(avatarUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      setAvatar(await uploadImage(file, `avatars/${userId}`))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'errors.upload_failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="avatarUrl" value={avatar} />
      <div className="flex items-center gap-4">
        <UserAvatar name={displayName} url={avatar} className="h-16 w-16 text-xl" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('me.change_avatar')}
        </Button>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {uploadError && <p className="text-sm text-destructive">{t(uploadError)}</p>}
      <div className="max-w-sm space-y-2">
        <Label htmlFor="displayName">{t('auth.display_name')}</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName ?? ''} maxLength={40} required />
        <FieldError state={state} name="displayName" />
      </div>
      <FormFeedback state={state} />
      <SubmitButton disabled={uploading}>{t('me.save')}</SubmitButton>
    </form>
  )
}
