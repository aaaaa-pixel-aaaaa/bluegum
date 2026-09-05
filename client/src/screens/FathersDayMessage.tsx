import { PillButton } from '../components/PillButton'

const LEAF = 'M50,8 C82,30 82,74 50,92 C40,74 40,26 50,8 Z'

function sprigLeaf(x: number, y: number, size: number, rotate: number) {
  const s = size / 100
  return (
    <g key={`${x}-${y}`} transform={`translate(${x},${y}) rotate(${rotate}) scale(${s}) translate(-50,-50)`}>
      <path d={LEAF} fill="var(--color-sickle)" />
    </g>
  )
}

// A small decorative sprig — a wavy line with leaves scattered along it —
// marking this as the one screen with a personal note rather than app copy.
function Sprig() {
  return (
    <svg viewBox="0 0 240 100" width={200} height={84} aria-hidden="true">
      <path
        d="M10,30 C50,12 70,48 110,30 C150,12 170,48 210,30"
        fill="none"
        stroke="var(--color-sickle)"
        strokeWidth={1.5}
      />
      {sprigLeaf(30, 18, 16, -30)}
      {sprigLeaf(70, 42, 14, 25)}
      {sprigLeaf(110, 16, 18, -15)}
      {sprigLeaf(150, 42, 14, 20)}
      {sprigLeaf(190, 18, 16, -30)}
    </svg>
  )
}

export function FathersDayMessage({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <Sprig />
      <div className="mt-2 max-w-md">
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
        <p className="mt-4 font-serif text-md italic leading-relaxed text-glaucous">
          PS: I hope you enjoy the bluegum style here, maybe might give you a few ideas about your
          own app. Love ya
        </p>
      </div>
      <PillButton variant="primary" onClick={onContinue} className="mt-10">
        Continue
      </PillButton>
    </div>
  )
}
