'use client'
import Image from 'next/image'

interface Props {
  src: string | null
  alt: string
  houseLetter: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
}

export function BottleImage({ src, alt, houseLetter, className = '', fill, width, height }: Props) {
  if (!src) {
    return (
      <div className={`bg-stone-100 rounded-xl flex items-center justify-center ${className}`}>
        <span className="font-serif text-2xl text-stone-400">{houseLetter}</span>
      </div>
    )
  }
  if (fill) {
    return <Image src={src} alt={alt} fill className={`object-contain ${className}`} sizes="300px" />
  }
  return <Image src={src} alt={alt} width={width ?? 200} height={height ?? 280} className={`object-contain ${className}`} />
}
