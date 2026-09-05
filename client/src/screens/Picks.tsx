import { useState } from 'react'
import type { Pick } from '../../../shared/types'
import { Branch, BranchItem } from '../components/Branch'
import { PillButton } from '../components/PillButton'
import { Poster } from '../components/Poster'
import { RatingSheet } from '../components/RatingSheet'
import { TopBar } from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

export function Picks({ onAbout }: { onAbout: () => void }) {
  const { profile, dismiss, save, rate, refresh, refreshStatus } = useProfile()
  const [rating, setRating] = useState<Pick | null>(null)
  const shown = profile.lastPicks?.shown ?? []

  return (
    <div className="pb-28">
      <TopBar title="Bluegum" onAbout={onAbout} />
      <div className="mx-auto flex max-w-md justify-end px-6">
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshStatus === 'refreshing'}
          className="press min-h-11 px-2 font-sans text-base text-heartwood/60 active:text-heartwood disabled:opacity-50"
        >
          {refreshStatus === 'refreshing' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {refreshStatus === 'error' && (
        <p className="mx-auto mt-4 max-w-md px-6 text-center font-sans text-sm text-heartwood/60">
          Couldn't refresh — showing your last picks.
        </p>
      )}

      {shown.length === 0 ? (
        <p className="mx-auto mt-16 max-w-md px-6 text-center font-serif text-md text-heartwood">
          Nothing to show yet. Try refresh.
        </p>
      ) : (
        <Branch>
          {shown.map((pick, i) => (
            <BranchItem
              key={pick.tmdbId}
              align={i % 2 === 0 ? 'left' : 'right'}
              poster={<Poster posterPath={pick.posterPath} title={pick.title} />}
              animateIndex={i}
            >
              <p className="font-serif text-lg text-heartwood">
                {pick.title}, {pick.year}
              </p>
              <p className="mt-2 max-w-[60ch] font-serif text-md text-heartwood">{pick.reason}</p>
              <div className={`mt-4 flex flex-wrap gap-2 ${i % 2 === 0 ? '' : 'justify-end'}`}>
                <PillButton onClick={() => setRating(pick)}>Seen it</PillButton>
                <PillButton onClick={() => dismiss(pick)}>Not for me</PillButton>
                <PillButton onClick={() => save(pick)}>Save for later</PillButton>
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
            void rate(rating, score)
            setRating(null)
          }}
        />
      )}
    </div>
  )
}
