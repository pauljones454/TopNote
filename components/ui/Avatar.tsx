import Image from 'next/image'

type AvatarProps = {
  /** Cloudinary (or other remote) image URL. Falls back to the initial when null. */
  url: string | null | undefined
  /** Name the initial is derived from — display name, handle, or email. */
  name: string | null | undefined
  /** Rendered width/height in px. Drives both the box and the image sizes hint. */
  size: number
  className?: string
}

/**
 * The single avatar surface for Top Note: photo when the user has one,
 * otherwise the house-style initial disc.
 */
export function Avatar({ url, name, size, className = '' }: AvatarProps) {
  const initial = (name?.trim() || 'U').charAt(0).toUpperCase()
  // Type scales with the disc so a 28px review avatar and a 64px header avatar both read correctly.
  const fontSize = Math.max(11, Math.round(size * 0.4))

  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: 'var(--brand-dark, #3a2e28)' }}
    >
      {url ? (
        <Image
          src={url}
          alt={name?.trim() || 'Profile photo'}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center font-serif text-white"
          style={{ fontSize }}
        >
          {initial}
        </span>
      )}
    </div>
  )
}
