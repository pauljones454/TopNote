import { createHash } from 'node:crypto'

/**
 * Server-only Cloudinary upload. The API secret never leaves the server:
 * the upload is signed here and posted straight to Cloudinary from the server action.
 */

export type CloudinaryUpload =
  | { ok: true; secureUrl: string }
  | { ok: false; error: string }

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string }

function readConfig(): CloudinaryConfig | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

/** Cloudinary signs the alphabetically sorted, `&`-joined params plus the API secret. */
function sign(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  return createHash('sha1').update(payload + apiSecret).digest('hex')
}

/**
 * Uploads an avatar to a deterministic public id per user, overwriting any previous one.
 * The returned secure URL carries a fresh version segment, so it busts caches on replace.
 */
export async function uploadAvatarImage(file: File, userId: string): Promise<CloudinaryUpload> {
  const config = readConfig()
  if (!config) {
    return { ok: false, error: 'Image uploads are not configured. Set the Cloudinary environment variables.' }
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signedParams: Record<string, string> = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: `topnote/avatars/${userId}`,
    timestamp,
  }

  const body = new FormData()
  body.append('file', file)
  body.append('api_key', config.apiKey)
  body.append('signature', sign(signedParams, config.apiSecret))
  for (const [key, value] of Object.entries(signedParams)) body.append(key, value)

  let response: Response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST',
      body,
    })
  } catch (cause) {
    console.error('[cloudinary] upload request failed for user', userId, cause)
    return { ok: false, error: 'Could not reach the image service. Try again.' }
  }

  const payload = (await response.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null

  if (!response.ok || !payload?.secure_url) {
    const detail = payload?.error?.message ?? `HTTP ${response.status}`
    console.error('[cloudinary] upload rejected for user', userId, detail)
    return { ok: false, error: `Upload failed: ${detail}` }
  }

  return { ok: true, secureUrl: payload.secure_url }
}
