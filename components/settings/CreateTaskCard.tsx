'use client'

import { useState } from 'react'

type TaskState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; threadId: string | undefined }
  | { status: 'error'; message: string }

type TaskResponse = { ok?: boolean; threadId?: string; error?: string }

export function CreateTaskCard() {
  const [instruction, setInstruction] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState<TaskState>({ status: 'idle' })

  const isLoading = state.status === 'loading'
  const canSubmit = instruction.trim().length > 0 && !isLoading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: instruction.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
        }),
      })

      const data = (await res.json()) as TaskResponse

      if (!res.ok) {
        setState({
          status: 'error',
          message: data.error ?? 'Something went wrong — please try again.',
        })
        return
      }

      setState({ status: 'success', threadId: data.threadId })
      setInstruction('')
      setName('')
    } catch {
      setState({
        status: 'error',
        message: 'Network error — please check your connection and try again.',
      })
    }
  }

  function reset() {
    setState({ status: 'idle' })
  }

  return (
    <div
      className="rounded-2xl bg-white/60 border border-stone-200/60 px-6 py-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="mb-4">
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Obvious AI</p>
        <h2 className="font-serif text-lg text-stone-900">Ask Obvious</h2>
        <p className="text-sm text-stone-400 leading-relaxed mt-1">
          Describe a task and an Obvious AI agent will take care of it.
        </p>
      </div>

      {state.status === 'success' ? (
        // Success state
        <div className="space-y-3">
          <div
            className="rounded-xl px-4 py-3.5 bg-stone-50 border border-stone-100"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}
          >
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Session started</p>
            <p className="text-sm text-stone-700 leading-relaxed">
              Your Obvious agent is now running.
              {state.threadId && (
                <>
                  {' '}Thread{' '}
                  <span className="font-mono text-[11px] text-stone-500">{state.threadId}</span>.
                </>
              )}
            </p>
          </div>
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl border border-stone-200 text-sm text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-colors duration-200"
            style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
          >
            Start another task
          </button>
        </div>
      ) : (
        // Idle / loading / error state
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Instruction textarea */}
          <div>
            <label
              htmlFor="obvious-instruction"
              className="block text-[10px] font-bold tracking-[1.5px] uppercase text-stone-400 mb-1.5"
            >
              Instruction
            </label>
            <textarea
              id="obvious-instruction"
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              placeholder="Tell Obvious what to do…"
              rows={4}
              maxLength={4000}
              disabled={isLoading}
              className="w-full resize-none rounded-xl bg-stone-50/80 border border-stone-200/80 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors duration-200 disabled:opacity-50"
              style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
            />
          </div>

          {/* Optional name */}
          <div>
            <label
              htmlFor="obvious-name"
              className="block text-[10px] font-bold tracking-[1.5px] uppercase text-stone-400 mb-1.5"
            >
              Name{' '}
              <span className="normal-case tracking-normal font-normal opacity-60">(optional)</span>
            </label>
            <input
              id="obvious-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Weekly fragrance report"
              maxLength={200}
              disabled={isLoading}
              className="w-full rounded-xl bg-stone-50/80 border border-stone-200/80 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors duration-200 disabled:opacity-50"
              style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
            />
          </div>

          {/* Inline error */}
          {state.status === 'error' && (
            <p className="text-sm text-red-400 leading-relaxed">{state.message}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              transitionTimingFunction: 'var(--ease-out-expo)',
              background: canSubmit ? '#3a2e28' : 'transparent',
              color: canSubmit ? '#FAF8F5' : 'rgb(168 162 158)',
              border: canSubmit ? '1px solid transparent' : '1px solid rgb(214 211 209)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                Starting session…
              </span>
            ) : (
              'Start Obvious session'
            )}
          </button>
        </form>
      )}
    </div>
  )
}

