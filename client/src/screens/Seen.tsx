import { useState } from 'react'
import type { Rating } from '../../../shared/types'
import { Branch, BranchItem } from '../components/Branch'
import { PillButton } from '../components/PillButton'
import { Poster } from '../components/Poster'
import { RatingSheet } from '../components/RatingSheet'
import { TopBar } from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

export function Seen({ onAbout }: { onAbout: () => void }) {
  const { profile, rate } = useProfile()
  const [rating, setRating] = useState<Rating | null>(null)

  return (
    <div className="pb-28">
      <TopBar title="Seen" onAbout={onAbout} />

      {profile.ratings.length === 0 ? (
        <p className="mx-auto mt-16 max-w-md px-6 text-center font-serif text-md text-heartwood">
          Nothing rated yet. Whatever you mark seen turns up here.
        </p>
      ) : (
        <Branch>
          {profile.ratings.map((r, i) => (
            <BranchItem
              key={r.tmdbId}
              align={i % 2 === 0 ? 'left' : 'right'}
              poster={<Poster posterPath={r.posterPath} title={r.title} />}
            >
              <p className="font-serif text-lg text-heartwood">
                {r.title}, {r.year}
              </p>
              <p className="mt-2 font-sans text-base text-heartwood/60">Rated {r.score}/5</p>
              <div className={`mt-4 flex ${i % 2 === 0 ? '' : 'justify-end'}`}>
                <PillButton onClick={() => setRating(r)}>Change score</PillButton>
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
