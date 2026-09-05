import { useState } from 'react'
import { AVOID_OPTIONS, type Pacing } from '../../../shared/types'
import { LoadingBranch } from '../components/LoadingBranch'
import { PillButton } from '../components/PillButton'
import { useProfile } from '../state/ProfileContext'

const PACING_LABELS: Record<Pacing, string> = {
  patient: 'Patient, let it breathe',
  either: 'Either is fine',
  brisk: 'Brisk, keep it moving',
}

export function Calibration() {
  const { setCalibration, completeCalibration, isGeneratingFirstPicks } = useProfile()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [subtitlesOk, setSubtitlesOk] = useState(true)
  const [pacing, setPacing] = useState<Pacing>('either')
  const [avoid, setAvoid] = useState<string[]>([])

  function next() {
    if (step < 2) {
      setStep((s) => (s + 1) as 0 | 1 | 2)
      return
    }
    setCalibration({ subtitlesOk, pacing, avoid })
    void completeCalibration()
  }

  if (isGeneratingFirstPicks) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <LoadingBranch label="Finding your first picks…" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col justify-between px-6 pb-10 pt-16">
      <div>
        {step === 0 && (
          <>
            <p className="font-serif text-xl text-heartwood">Do you mind subtitles?</p>
            <div className="mt-8 flex flex-col gap-3">
              <PillButton variant={subtitlesOk ? 'primary' : 'secondary'} onClick={() => setSubtitlesOk(true)}>
                Subtitles are fine
              </PillButton>
              <PillButton variant={!subtitlesOk ? 'primary' : 'secondary'} onClick={() => setSubtitlesOk(false)}>
                I'd rather not
              </PillButton>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="font-serif text-xl text-heartwood">How do you like things paced?</p>
            <div className="mt-8 flex flex-col gap-3">
              {(Object.keys(PACING_LABELS) as Pacing[]).map((option) => (
                <PillButton key={option} variant={pacing === option ? 'primary' : 'secondary'} onClick={() => setPacing(option)}>
                  {PACING_LABELS[option]}
                </PillButton>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="font-serif text-xl text-heartwood">Anything you'd never watch?</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {AVOID_OPTIONS.map((option) => {
                const active = avoid.includes(option)
                return (
                  <PillButton
                    key={option}
                    variant={active ? 'primary' : 'secondary'}
                    onClick={() => setAvoid((a) => (active ? a.filter((x) => x !== option) : [...a, option]))}
                  >
                    {option}
                  </PillButton>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={next}
          className="press min-h-11 font-sans text-base text-heartwood/60 active:text-heartwood"
        >
          Skip
        </button>
        <PillButton variant="primary" onClick={next}>
          {step === 2 ? 'Done' : 'Next'}
        </PillButton>
      </div>
    </div>
  )
}
