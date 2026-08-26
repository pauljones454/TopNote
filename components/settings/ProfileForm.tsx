'use client'

import { useActionState, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { saveProfile } from '@/app/settings/actions'
import type { ProfileField, ProfileFormState, ProfileValues } from '@/app/settings/actions'
import { TextField } from './TextField'
import {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  HANDLE_MAX_LENGTH,
  normalizeHandle,
  validateBio,
  validateDisplayName,
  validateHandle,
} from '@/lib/profile/validation'

type FieldFlags = Record<ProfileField, boolean>
type FieldMessages = Partial<Record<ProfileField, string>>

const UNTOUCHED: FieldFlags = { display_name: false, handle: false, bio: false }
const INITIAL_STATE: ProfileFormState = { status: 'idle' }

/** Compare on the same normalization the server applies, so whitespace alone is not "dirty". */
function isDirty(values: ProfileValues, baseline: ProfileValues): boolean {
  return (
    values.display_name.trim() !== baseline.display_name.trim() ||
    normalizeHandle(values.handle) !== normalizeHandle(baseline.handle) ||
    values.bio.trim() !== baseline.bio.trim()
  )
}

function clientErrorsFor(values: ProfileValues): FieldMessages {
  const errors: FieldMessages = {}

  const displayName = validateDisplayName(values.display_name)
  if (!displayName.ok) errors.display_name = displayName.error

  const handle = validateHandle(values.handle)
  if (!handle.ok) errors.handle = handle.error

  const bio = validateBio(values.bio)
  if (!bio.ok) errors.bio = bio.error

  return errors
}

export function ProfileForm({ initialValues }: { initialValues: ProfileValues }) {
  const [state, formAction, isPending] = useActionState(saveProfile, INITIAL_STATE)
  const [values, setValues] = useState<ProfileValues>(initialValues)
  const [baseline, setBaseline] = useState<ProfileValues>(initialValues)
  const [touched, setTouched] = useState<FieldFlags>(UNTOUCHED)
  const [serverErrors, setServerErrors] = useState<FieldMessages>({})

  // Fold each action result back into local state: a save becomes the new baseline.
  useEffect(() => {
    if (state.status === 'error') {
      setServerErrors(state.fieldErrors)
      return
    }
    if (state.status === 'saved') {
      setServerErrors({})
      setTouched(UNTOUCHED)
      setValues(state.values)
      setBaseline(state.values)
    }
  }, [state])

  function updateField(field: ProfileField, value: string) {
    setValues(current => ({ ...current, [field]: value }))
    // A server verdict (e.g. "handle taken") stops applying the moment the field changes.
    setServerErrors(current => ({ ...current, [field]: undefined }))
  }

  function markTouched(field: ProfileField) {
    setTouched(current => ({ ...current, [field]: true }))
  }

  const clientErrors = clientErrorsFor(values)
  const dirty = isDirty(values, baseline)
  const hasClientError = Object.keys(clientErrors).length > 0
  const canSave = dirty && !hasClientError && !isPending

  function errorFor(field: ProfileField): string | undefined {
    return serverErrors[field] ?? (touched[field] ? clientErrors[field] : undefined)
  }

  const formError = state.status === 'error' && Object.keys(serverErrors).length === 0
    ? state.message
    : undefined
  const showSaved = state.status === 'saved' && !dirty

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        label="Display name"
        name="display_name"
        value={values.display_name}
        onChange={value => updateField('display_name', value)}
        onBlur={() => markTouched('display_name')}
        disabled={isPending}
        error={errorFor('display_name')}
        hint="The name shown on your profile and reviews."
        placeholder="Your name"
        maxLength={DISPLAY_NAME_MAX_LENGTH}
      />

      <TextField
        label="Handle"
        name="handle"
        value={values.handle}
        onChange={value => updateField('handle', normalizeHandle(value))}
        onBlur={() => markTouched('handle')}
        disabled={isPending}
        error={errorFor('handle')}
        hint="Your unique @name. Letters, numbers, dots and underscores."
        prefix="@"
        placeholder="yourhandle"
        maxLength={HANDLE_MAX_LENGTH}
      />

      <TextField
        label="Bio"
        name="bio"
        value={values.bio}
        onChange={value => updateField('bio', value)}
        onBlur={() => markTouched('bio')}
        disabled={isPending}
        error={errorFor('bio')}
        hint="A line or two about what you wear."
        placeholder="Amber, oud, and anything that lasts past midnight."
        maxLength={BIO_MAX_LENGTH}
        multiline
      />

      {formError && (
        <p
          className="text-[12px] text-red-600 leading-relaxed rounded-xl px-4 py-3"
          style={{ background: 'rgba(190,60,50,0.06)', border: '1px solid rgba(190,60,50,0.18)' }}
          role="alert"
        >
          {formError}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!canSave}
          className="px-6 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold transition-opacity duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>

        {showSaved && (
          <span className="flex items-center gap-1.5 text-[12px] text-stone-500">
            <Check size={13} strokeWidth={1.75} />
            Saved
          </span>
        )}
        {!showSaved && dirty && !isPending && (
          <span className="text-[12px] text-stone-400">Unsaved changes</span>
        )}
      </div>
    </form>
  )
}
