import { useRef, useState, type ChangeEvent } from 'react'
import { PillButton } from '../components/PillButton'
import { useProfile } from '../state/ProfileContext'

export function About({ onBack }: { onBack: () => void }) {
  const { exportBackup, restoreBackup } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await restoreBackup(file)
      setRestoreMessage('Backup restored.')
    } catch (err) {
      setRestoreMessage(err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  return (
    <div className="min-h-svh pb-16">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 pt-6">
        <h1 className="font-sans text-base font-medium text-heartwood">About</h1>
        <button
          type="button"
          onClick={onBack}
          className="press min-h-11 px-2 font-sans text-base text-heartwood/60 active:text-heartwood"
        >
          Close
        </button>
      </header>

      <div className="mx-auto mt-8 max-w-md px-6">
        <p className="font-serif text-md text-heartwood">Bluegum</p>
        <p className="mt-2 font-sans text-base text-heartwood/70">
          A private recommendation list, built for one household and one taste.
        </p>

        <p className="mt-10 font-sans text-base text-heartwood">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <PillButton variant="primary" onClick={exportBackup}>
            Export a backup
          </PillButton>
          <PillButton onClick={() => fileInputRef.current?.click()}>Restore a backup</PillButton>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFile} className="hidden" />
          {restoreMessage && <p className="font-sans text-sm text-heartwood/60">{restoreMessage}</p>}
        </div>
      </div>
    </div>
  )
}
