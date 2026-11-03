import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

import type { Attack } from '../../lib/types'

const MAX_PROMPT_LENGTH = 4000
const MAX_ATTACKS = 6

const PRIMARY_BUTTON =
  'rounded-md bg-accent-400 px-stack py-stack-sm text-sm font-medium text-base-950 transition-colors hover:bg-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-ink-400'

const SECONDARY_BUTTON =
  'rounded-md border border-line px-stack py-stack-sm text-sm text-ink-700 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none'

type ConfigModalProps = {
  attacks: Attack[]
  onClose: () => void
  onConfirm: (systemPrompt: string, attackIds: string[]) => void
}

function ConfigModal({ attacks, onClose, onConfirm }: ConfigModalProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const dialogRef = useRef<HTMLDivElement>(null)
  const promptId = useId()
  const titleId = useId()
  const limitId = useId()

  // Focus moves into the dialog on open and returns to the opener on close.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.querySelector('textarea')?.focus()

    return () => opener?.focus()
  }, [])

  const isOverLimit = prompt.length > MAX_PROMPT_LENGTH
  const trimmedPrompt = prompt.trim()
  const canConfirm = trimmedPrompt.length > 0 && !isOverLimit && selectedIds.length > 0

  const toggleAttack = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((selected) => selected !== id)
      }
      if (current.length >= MAX_ATTACKS) {
        return current
      }
      return [...current, id]
    })
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.current) {
      return
    }

    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    )

    if (focusables.length === 0) {
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-overlay p-page lg:p-page-lg"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[68rem] rounded-lg border border-line bg-base-900 p-panel shadow-panel lg:p-page-lg"
      >
        <h2 id={titleId} className="text-2xl font-semibold text-ink-900">
          Configurar auditoria
        </h2>
        <p className="mt-stack-sm text-sm text-ink-500">
          Cole o system prompt e escolha de 1 a 6 ataques.
        </p>

        <div className="mt-panel grid gap-section lg:grid-cols-[1.15fr_24rem] lg:gap-section-lg">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-stack-sm">
              <label htmlFor={promptId} className="text-sm font-medium text-ink-700">
                System prompt
              </label>
              <output
                aria-live="polite"
                className="font-mono text-2xs tracking-tag text-ink-400"
              >
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </output>
            </div>
            <textarea
              id={promptId}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={14}
              aria-describedby={isOverLimit ? limitId : undefined}
              aria-invalid={isOverLimit}
              placeholder="Cole aqui o system prompt da sua aplicação."
              className="mt-stack-sm min-h-[20rem] w-full resize-y rounded-md border border-line bg-base-950 px-card py-stack font-mono text-sm text-ink-700 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
            />
            {isOverLimit && (
              <p id={limitId} role="alert" className="mt-stack-sm text-sm text-danger-300">
                O prompt passa de {MAX_PROMPT_LENGTH} caracteres. Reduza para continuar.
              </p>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-stack-sm">
              <p id={`${promptId}-attacks`} className="text-sm font-medium text-ink-700">
                Ataques
              </p>
              <output
                aria-live="polite"
                className="font-mono text-2xs tracking-tag text-ink-400"
              >
                {selectedIds.length}/{MAX_ATTACKS}
              </output>
            </div>
            <ul
              aria-labelledby={`${promptId}-attacks`}
              className="mt-stack-sm max-h-[min(60vh,32rem)] space-y-stack-sm overflow-y-auto pr-stack [scrollbar-gutter:stable]"
            >
              {attacks.map((attack) => {
                const checked = selectedIds.includes(attack.id)
                const blocked = !checked && selectedIds.length >= MAX_ATTACKS

                return (
                  <li key={attack.id}>
                    <label
                      className={`flex cursor-pointer gap-stack-sm rounded-md border p-card transition-colors ${
                        checked ? 'border-accent-400 bg-accent-400/10' : 'border-line bg-base-850'
                      } ${blocked ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={blocked}
                        onChange={() => toggleAttack(attack.id)}
                        className="mt-stack-sm h-4 w-4 shrink-0 appearance-none rounded-xs border border-line-strong bg-base-950 checked:border-accent-400 checked:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-ink-700">{attack.title}</span>{' '}
                        <span className="mt-stack-sm block text-xs text-ink-400">
                          {attack.description}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="mt-panel flex flex-wrap justify-end gap-stack-sm">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmedPrompt, selectedIds)}
            disabled={!canConfirm}
            className={PRIMARY_BUTTON}
          >
            Confirmar auditoria
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfigModal
