import { useState } from 'react'
import type { Title } from '../../../shared/types'
import { Branch, BranchItem } from '../components/Branch'
import { LeafGlyph } from '../components/LeafGlyph'
import { PillButton } from '../components/PillButton'
import { Poster } from '../components/Poster'
import { RatingSheet } from '../components/RatingSheet'
import { TopBar } from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

const EXIT_MS = 420

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Saved({ onAbout }: { onAbout: () => void }) {
  const { profile, removeSaved, rate } = useProfile()
  const [rating, setRating] = useState<Title | null>(null)
  const [exiting, setExiting] = useState<Map<number, 'fall' | 'settle'>>(new Map())

  function runExit(tmdbId: number, kind: 'fall' | 'settle', action: () => void) {
    if (prefersReducedMotion()) {
      action()
      return
    }
    setExiting((prev) => new Map(prev).set(tmdbId, kind))
    setTimeout(() => {
      action()
      setExiting((prev) => {
        const next = new Map(prev)
        next.delete(tmdbId)
        return next
      })
    }, EXIT_MS)
  }

  return (
    <div className="pb-28">
      <TopBar title="Saved" onAbout={onAbout} />

      {profile.saved.length === 0 ? (
        <p className="mx-auto mt-16 max-w-md px-6 text-center font-serif text-md text-heartwood">
          Nothing saved yet. Anything you keep turns up here.
        </p>
      ) : (
        <Branch>
          {profile.saved.map((title, i) => (
            <BranchItem
              key={title.tmdbId}
              align={i % 2 === 0 ? 'left' : 'right'}
              poster={<Poster posterPath={title.posterPath} title={title.title} />}
              exit={exiting.get(title.tmdbId)}
            >
              <p className="font-serif text-lg text-heartwood">
                {title.title}, {title.year}
              </p>
              <div className={`mt-4 flex flex-wrap gap-2 ${i % 2 === 0 ? '' : 'justify-end'}`}>
                <PillButton icon={<LeafGlyph variant="solid" size={12} />} onClick={() => setRating(title)}>
                  Seen it
                </PillButton>
                <PillButton
                  icon={<LeafGlyph variant="falling" size={12} />}
                  onClick={() => runExit(title.tmdbId, 'fall', () => removeSaved(title.tmdbId))}
                >
                  Remove
                </PillButton>
              </div>
            </BranchItem>
          ))}
        </Branch>
      )}

      {rating && (
        <RatingSheet
          title={`${rating.title}, ${rating.year}`}
          onCancel={() => setRating(null)}
          onRate={(score) => {
            const target = rating
            setRating(null)
            runExit(target.tmdbId, 'settle', () => {
              void rate(target, score)
              removeSaved(target.tmdbId)
            })
          }}
        />
      )}
    </div>
  )
}
