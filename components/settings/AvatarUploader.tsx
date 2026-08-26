'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { removeAvatar, saveAvatar } from '@/app/settings/actions'
import type { AvatarFormState } from '@/app/settings/actions'
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  AVATAR_MAX_BYTES,
  validateAvatarFile,
} from '@/lib/profile/validation'

const INITIAL_STATE: AvatarFormState = { status: 'idle' }
const MAX_MB = AVATAR_MAX_BYTES / (1024 * 1024)

type AvatarUploaderProps = {
  initialAvatarUrl: string | null
  displayName: string
}

export function AvatarUploader({ initialAvatarUrl, displayName }: AvatarUploaderProps) {
  const [state, formAction, isUploading] = useActionState(saveAvatar, INITIAL_STATE)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isRemoving, startRemoval] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.status === 'saved') {
      setAvatarUrl(state.avatarUrl === '' ? null : state.avatarUrl)
      setLocalError(null)
    }
  }, [state])

  const busy = isUploading || isRemoving
  const error = localError ?? (state.status === 'error' ? state.message : null)

  function handleFileChosen(file: File | undefined) {
    if (!file) return

    const check = validateAvatarFile(file)
    if (!check.ok) {
      setLocalError(check.error)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setLocalError(null)
    formRef.current?.requestSubmit()
  }

  function handleRemove() {
    setLocalError(null)
    startRemoval(async () => {
      const result = await removeAvatar()
      if (result.status === 'saved') {
        setAvatarUrl(null)
        if (inputRef.current) inputRef.current.value = ''
        return
      }
      if (result.status === 'error') setLocalError(result.message)
    })
  }

  return (
    <div>
      <form ref={formRef} action={formAction}>
        <div className="flex items-center gap-5">
          <Avatar
            url={avatarUrl}
            name={displayName}
            size={72}
            className={busy ? 'opacity-50 transition-opacity duration-200' : 'transition-opacity duration-200'}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-stone-900 text-white text-[13px] font-semibold transition-opacity duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
              >
                {isUploading ? 'Uploading…' : avatarUrl ? 'Replace photo' : 'Upload photo'}
              </button>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-white text-[13px] text-stone-500 transition-colors duration-200 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(0,0,0,0.10)', transitionTimingFunction: 'var(--ease-out-expo)' }}
                >
                  {isRemoving ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed mt-2">
              JPEG, PNG or WebP. Up to {MAX_MB}MB.
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept={AVATAR_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={event => handleFileChosen(event.target.files?.[0])}
        />
      </form>

      {error && (
        <p
          className="text-[12px] text-red-600 leading-relaxed rounded-xl px-4 py-3 mt-4"
          style={{ background: 'rgba(190,60,50,0.06)', border: '1px solid rgba(190,60,50,0.18)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
