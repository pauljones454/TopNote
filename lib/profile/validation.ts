/**
 * Pure validation + normalization for the editable fields of a profile.
 * Shared by the settings server action and (for handles) signup.
 */

export const HANDLE_MIN_LENGTH = 3
export const HANDLE_MAX_LENGTH = 20
export const DISPLAY_NAME_MAX_LENGTH = 50
export const BIO_MAX_LENGTH = 280

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/** `accept` attribute for the file input — kept in step with the accepted types. */
export const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ACCEPTED_TYPES.join(',')

/** The gender answer captured at signup. Mirrors the CHECK constraint on profiles.gender. */
export const GENDER_PREFERENCES = ['masculine', 'feminine', 'both'] as const
export type GenderPreference = (typeof GENDER_PREFERENCES)[number]

export function isGenderPreference(value: string): value is GenderPreference {
  return (GENDER_PREFERENCES as readonly string[]).includes(value)
}

/** Strip everything a handle may not contain, and lowercase it. Matches the signup input filter. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').replace(/[^a-z0-9_.]/gi, '').toLowerCase()
}

/** a-z, 0-9, underscore and dot; must start and end alphanumeric; no run of dots. */
const HANDLE_SHAPE = /^[a-z0-9][a-z0-9_.]*[a-z0-9]$/

export type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string }

export function validateHandle(raw: string): FieldResult<string> {
  const handle = normalizeHandle(raw)

  if (handle.length === 0) return { ok: false, error: 'Pick a handle.' }
  if (handle.length < HANDLE_MIN_LENGTH) {
    return { ok: false, error: `Handles are at least ${HANDLE_MIN_LENGTH} characters.` }
  }
  if (handle.length > HANDLE_MAX_LENGTH) {
    return { ok: false, error: `Handles are at most ${HANDLE_MAX_LENGTH} characters.` }
  }
  if (!HANDLE_SHAPE.test(handle)) {
    return { ok: false, error: 'Use letters, numbers, dots and underscores. Start and end with a letter or number.' }
  }
  if (handle.includes('..')) {
    return { ok: false, error: 'Handles cannot contain two dots in a row.' }
  }

  return { ok: true, value: handle }
}

export function validateDisplayName(raw: string): FieldResult<string> {
  const name = raw.trim().replace(/\s+/g, ' ')

  if (name.length === 0) return { ok: false, error: 'Add a name so people know who you are.' }
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: `Names are at most ${DISPLAY_NAME_MAX_LENGTH} characters.` }
  }

  return { ok: true, value: name }
}

/** Bio is optional — an empty bio is stored as null, not an empty string. */
export function validateBio(raw: string): FieldResult<string | null> {
  const bio = raw.trim()

  if (bio.length === 0) return { ok: true, value: null }
  if (bio.length > BIO_MAX_LENGTH) {
    return { ok: false, error: `Bios are at most ${BIO_MAX_LENGTH} characters.` }
  }

  return { ok: true, value: bio }
}

/**
 * Signup seeds `display_name` from the email local part when the user never typed a name.
 * That is a placeholder, not a name — the settings form starts blank so the user sets a real one.
 */
export function isDerivedDisplayName(displayName: string, email: string | undefined): boolean {
  const localPart = (email ?? '').split('@')[0]?.trim().toLowerCase()
  if (!localPart) return false

  return displayName.trim().toLowerCase() === localPart
}

/** Guards the avatar before it reaches Cloudinary — or the database. Safe on client and server. */
export function validateAvatarFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: 'That file is empty. Pick another image.' }
  if (!(AVATAR_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: 'Use a JPEG, PNG or WebP image.' }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: `Images must be under ${AVATAR_MAX_BYTES / (1024 * 1024)}MB.` }
  }

  return { ok: true }
}
