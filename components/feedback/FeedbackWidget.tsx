'use client'

import { useEffect, useRef } from 'react'
import { ObviousFeedback, type FeedbackSdkHandle } from '@obvi/feedback-sdk'

/**
 * Mounts the Obvious Feedback widget app-wide.
 * No-ops silently when NEXT_PUBLIC_OBVIOUS_FEEDBACK_PUBLIC_KEY is not set,
 * so the app builds and runs cleanly in environments that haven't configured
 * the SDK keys yet.
 *
 * Identity tokens are fetched server-side (GET /api/feedback/identity) to
 * keep the secret key out of the browser bundle entirely.
 */
export default function FeedbackWidget() {
  // Guard against React StrictMode double-init
  const widgetRef = useRef<FeedbackSdkHandle | null>(null)

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_OBVIOUS_FEEDBACK_PUBLIC_KEY
    if (!publicKey) return // keys not set — skip silently

    let cancelled = false

    async function init() {
      // Attempt to get a verified identity token from the server route.
      // On 401 (unauthenticated), 204 (keys unset server-side), or any
      // fetch failure we proceed without a token — unverified is acceptable.
      let identityToken: string | undefined
      try {
        const res = await fetch('/api/feedback/identity')
        if (res.ok && res.status === 200) {
          const body = await res.json() as { token?: string }
          identityToken = body.token
        }
      } catch {
        // Network failure — proceed without token
      }

      if (cancelled) return // component unmounted before fetch resolved

      // Destroy any previous instance (safety net for StrictMode remounts)
      widgetRef.current?.destroy()

      widgetRef.current = ObviousFeedback.init({
        publicKey,
        ...(identityToken ? { identityToken } : {}),
        theme: 'dark',
        assistantPosition: 'bottom-right',
        capturePageContext: true,
        captureConsole: true,
        captureNetwork: true,
        visualSuggestions: { enabled: true },
        env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      })
    }

    void init()

    return () => {
      cancelled = true
      widgetRef.current?.destroy()
      widgetRef.current = null
    }
  }, [])

  // The widget renders its own DOM outside React's tree — nothing to render here
  return null
}

