'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { uploadAvatarImage } from '@/lib/cloudinary'
import {
  validateAvatarFile,
  validateBio,
  validateDisplayName,
  validateHandle,
} from '@/lib/profile/validation'

export type ProfileField = 'display_name' | 'handle' | 'bio'

export type ProfileValues = {
  display_name: string
  handle: string
  bio: string
}

export type ProfileFormState =
  | { status: 'idle' }
  | { status: 'saved'; values: ProfileValues }
  | { status: 'error'; message: string; fieldErrors: Partial<Record<ProfileField, string>> }

export type AvatarFormState =
  | { status: 'idle' }
  | { status: 'saved'; avatarUrl: string }
  | { status: 'error'; message: string }

const SESSION_EXPIRED = 'Your session has expired. Sign in again to save changes.'
const UNIQUE_VIOLATION = '23505'

function readField(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

/**
 * Saves the editable profile fields for the signed-in user.
 * The user id is taken from the session — never from the submitted form.
 */
export async function saveProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: SESSION_EXPIRED, fieldErrors: {} }

  const submitted: ProfileValues = {
    display_name: readField(formData, 'display_name'),
    handle: readField(formData, 'handle'),
    bio: readField(formData, 'bio'),
  }

  const displayName = validateDisplayName(submitted.display_name)
  const handle = validateHandle(submitted.handle)
  const bio = validateBio(submitted.bio)

  const fieldErrors: Partial<Record<ProfileField, string>> = {}
  if (!displayName.ok) fieldErrors.display_name = displayName.error
  if (!handle.ok) fieldErrors.handle = handle.error
  if (!bio.ok) fieldErrors.bio = bio.error

  if (!displayName.ok || !handle.ok || !bio.ok) {
    return { status: 'error', message: 'Check the highlighted fields.', fieldErrors }
  }

  // Handle uniqueness, case-insensitively, excluding the user's own row.
  // `ilike` treats `_` as a wildcard, so the exact match is confirmed in JS.
  const { data: sameHandle, error: lookupError } = await supabase
    .from('profiles')
    .select('id, handle')
    .ilike('handle', handle.value)
    .neq('id', user.id)
    .limit(20)

  if (lookupError) {
    console.error('[settings] handle lookup failed for user', user.id, lookupError)
    return { status: 'error', message: 'Could not check that handle. Try again.', fieldErrors: {} }
  }

  const taken = (sameHandle ?? []).some(row => row.handle?.toLowerCase() === handle.value)
  if (taken) {
    return {
      status: 'error',
      message: 'Check the highlighted fields.',
      fieldErrors: { handle: `@${handle.value} is taken.` },
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.value,
      handle: handle.value,
      bio: bio.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    // The unique index is the authoritative check — it also catches a race with another signup.
    if (updateError.code === UNIQUE_VIOLATION) {
      return {
        status: 'error',
        message: 'Check the highlighted fields.',
        fieldErrors: { handle: `@${handle.value} is taken.` },
      }
    }
    console.error('[settings] profile update failed for user', user.id, updateError)
    return { status: 'error', message: 'Could not save your profile. Try again.', fieldErrors: {} }
  }

  revalidatePath('/settings')
  revalidatePath('/profile')

  return {
    status: 'saved',
    values: {
      display_name: displayName.value,
      handle: handle.value,
      bio: bio.value ?? '',
    },
  }
}

/** Uploads a new avatar through Cloudinary and stores the resulting URL on the profile. */
export async function saveAvatar(
  _previous: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: SESSION_EXPIRED }

  const file = formData.get('avatar')
  if (!(file instanceof File)) return { status: 'error', message: 'Choose an image to upload.' }

  const fileCheck = validateAvatarFile(file)
  if (!fileCheck.ok) return { status: 'error', message: fileCheck.error }

  const upload = await uploadAvatarImage(file, user.id)
  if (!upload.ok) return { status: 'error', message: upload.error }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: upload.secureUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('[settings] avatar update failed for user', user.id, updateError)
    return { status: 'error', message: 'Uploaded the image, but could not save it to your profile.' }
  }

  revalidatePath('/settings')
  revalidatePath('/profile')

  return { status: 'saved', avatarUrl: upload.secureUrl }
}

/** Clears the avatar so the profile falls back to the initial disc. */
export async function removeAvatar(): Promise<AvatarFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: SESSION_EXPIRED }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('[settings] avatar removal failed for user', user.id, updateError)
    return { status: 'error', message: 'Could not remove your photo. Try again.' }
  }

  revalidatePath('/settings')
  revalidatePath('/profile')

  return { status: 'saved', avatarUrl: '' }
}
