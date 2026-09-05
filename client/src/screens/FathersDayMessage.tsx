import { LeafGlyph } from '../components/LeafGlyph'
import { PillButton } from '../components/PillButton'

export function FathersDayMessage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <LeafGlyph variant="solid" color="var(--color-sickle)" size={40} />
      <div className="mt-8 max-w-md">
        <p className="font-serif text-lg text-heartwood">Dear Dad,</p>
        <p className="mt-6 font-serif text-md leading-relaxed text-heartwood">
          Happy Father's Day! I hope you enjoy your present here. I spent a long ass time making
          this so if there's any tweaks/things you need fixed on the app please let me know.
          Otherwise I hope you enjoy your day and have a lovely time!
        </p>
        <p className="mt-6 font-serif text-md text-heartwood">
          Kind regards,
          <br />
          Aaron
        </p>
      </div>
      <PillButton variant="primary" onClick={onContinue} className="mt-10">
        Continue
      </PillButton>
    </div>
  )
}
