import { Branch, BranchItem } from '../components/Branch'
import { PillButton } from '../components/PillButton'
import { Poster } from '../components/Poster'
import { SearchField } from '../components/SearchField'
import { useProfile } from '../state/ProfileContext'

export function Screening({ onDone }: { onDone: () => void }) {
  const { profile, addSeed, removeSeed } = useProfile()
  const excludeIds = new Set(profile.seeds.map((s) => s.tmdbId))

  return (
    <div className="pb-32">
      <div className="mx-auto max-w-md px-6 pt-16">
        <p className="font-serif text-xl text-heartwood">Name ten films you'd defend at a dinner party.</p>
      </div>

      <div className="mt-8">
        <SearchField onPick={addSeed} excludeIds={excludeIds} />
      </div>

      {profile.seeds.length > 0 && (
        <Branch>
          {profile.seeds.map((seed, i) => (
            <BranchItem
              key={seed.tmdbId}
              align={i % 2 === 0 ? 'left' : 'right'}
              poster={
                <button type="button" onClick={() => removeSeed(seed.tmdbId)} className="press active:opacity-70">
                  <Poster posterPath={seed.posterPath} title={seed.title} />
                </button>
              }
            >
              <p className="font-serif text-md text-heartwood">
                {seed.title}
                {seed.year ? `, ${seed.year}` : ''}
              </p>
            </BranchItem>
          ))}
        </Branch>
      )}

      <div
        className="fixed inset-x-0 bottom-0 flex justify-center bg-paper px-6 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <PillButton variant="primary" disabled={profile.seeds.length < 5} onClick={onDone} className="w-full max-w-md">
          Done
        </PillButton>
      </div>
    </div>
  )
}
