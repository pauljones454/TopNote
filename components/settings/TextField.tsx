type TextFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  disabled: boolean
  error?: string
  hint?: string
  /** Fixed adornment rendered inside the input, e.g. the `@` on a handle. */
  prefix?: string
  placeholder?: string
  maxLength: number
  /** Renders a textarea with a live character count instead of a single-line input. */
  multiline?: boolean
}

const BASE_INPUT =
  'w-full rounded-xl bg-white text-sm text-stone-900 placeholder:text-stone-300 outline-none transition-colors duration-200 disabled:opacity-50'

export function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  hint,
  prefix,
  placeholder,
  maxLength,
  multiline = false,
}: TextFieldProps) {
  const borderColor = error ? 'rgba(190,60,50,0.45)' : 'rgba(0,0,0,0.10)'

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-2"
      >
        {label}
      </label>

      <div className="relative">
        {prefix && !multiline && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 pointer-events-none">
            {prefix}
          </span>
        )}

        {multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={event => onChange(event.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={4}
            aria-invalid={Boolean(error)}
            aria-describedby={`${name}-message`}
            className={`${BASE_INPUT} px-4 py-3 leading-relaxed resize-none`}
            style={{ border: `1px solid ${borderColor}`, transitionTimingFunction: 'var(--ease-out-expo)' }}
          />
        ) : (
          <input
            id={name}
            name={name}
            value={value}
            onChange={event => onChange(event.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={`${name}-message`}
            className={`${BASE_INPUT} py-3.5 pr-4 ${prefix ? 'pl-8' : 'pl-4'}`}
            style={{ border: `1px solid ${borderColor}`, transitionTimingFunction: 'var(--ease-out-expo)' }}
          />
        )}
      </div>

      <div className="flex items-start justify-between gap-4 mt-1.5">
        {/* One line serves both hint and error so the field never shifts height when it fails. */}
        <p
          id={`${name}-message`}
          role={error ? 'alert' : undefined}
          className={`text-[11px] leading-relaxed ${error ? 'text-red-600' : 'text-stone-400'}`}
        >
          {error ?? hint ?? ''}
        </p>
        {multiline && (
          <span className="text-[11px] text-stone-300 tabular-nums flex-shrink-0">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
