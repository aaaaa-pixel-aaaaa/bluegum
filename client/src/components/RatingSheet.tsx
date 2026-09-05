import { useState } from 'react'
import { LeafGlyph } from './LeafGlyph'
import { PillButton } from './PillButton'

type RatingSheetProps = {
  title: string
  onRate: (score: 1 | 2 | 3 | 4 | 5) => void
  onCancel: () => void
}

// Cancelling records nothing — there's no "seen but unrated" state in the
// data model (BRIEF.md §4), so a rating either happens or it doesn't.
export function RatingSheet({ title, onRate, onCancel }: RatingSheetProps) {
  const [selected, setSelected] = useState<number | null>(null)

  function pick(score: 1 | 2 | 3 | 4 | 5) {
    setSelected(score)
    // Let the leaves visibly fill before the sheet closes underneath them.
    setTimeout(() => onRate(score), 180)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-heartwood/40" onClick={onCancel}>
      <div
        className="w-full max-w-md bg-paper px-6 pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-serif text-md text-heartwood">How was {title}?</p>
        <div className="mt-6 flex justify-between gap-1">
          {([1, 2, 3, 4, 5] as const).map((score) => {
            const filled = selected !== null && score <= selected
            return (
              <button
                key={score}
                type="button"
                onClick={() => pick(score)}
                aria-label={`${score} out of 5`}
                className="press flex min-h-11 flex-1 items-center justify-center rounded-full"
              >
                <LeafGlyph
                  variant={filled ? 'solid' : 'hollow'}
                  color={filled ? 'var(--color-sickle)' : 'var(--color-bloom)'}
                  size={26}
                />
              </button>
            )
          })}
        </div>
        <PillButton onClick={onCancel} className="mt-6 w-full">
          Cancel
        </PillButton>
      </div>
    </div>
  )
}
