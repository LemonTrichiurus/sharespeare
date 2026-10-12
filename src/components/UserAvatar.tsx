import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({
  name,
  url,
  className,
}: {
  name: string | null | undefined
  url: string | null | undefined
  className?: string
}) {
  return (
    <Avatar className={cn('h-9 w-9', className)}>
      {url && <AvatarImage src={url} alt="" className="object-cover" />}
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
        {name?.trim().charAt(0).toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  )
}
