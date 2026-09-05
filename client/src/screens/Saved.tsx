import { useState } from 'react'
import type { Title } from '../../../shared/types'
import { Branch, BranchItem } from '../components/Branch'
import { PillButton } from '../components/PillButton'
import { Poster } from '../components/Poster'
import { RatingSheet } from '../components/RatingSheet'
import { TopBar } from '../components/TopBar'
import { useProfile } from '../state/ProfileContext'

export function Saved({ onAbout }: { onAbout: () => void }) {
  const { profile, removeSaved, rate } = useProfile()
  const [rating, setRating] = useState<Title | null>(null)

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
            >
              <p className="font-serif text-lg text-heartwood">
                {title.title}, {title.year}
              </p>
              <div className={`mt-4 flex flex-wrap gap-2 ${i % 2 === 0 ? '' : 'justify-end'}`}>
                <PillButton onClick={() => setRating(title)}>Seen it</PillButton>
                <PillButton onClick={() => removeSaved(title.tmdbId)}>Remove</PillButton>
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
            removeSaved(rating.tmdbId)
            setRating(null)
          }}
        />
      )}
    </div>
  )
}
