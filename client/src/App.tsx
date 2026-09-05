import { useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import {
  isFathersDayMessageShown,
  isScreeningDone,
  markFathersDayMessageShown,
  markScreeningDone,
} from './lib/onboarding'
import { About } from './screens/About'
import { Calibration } from './screens/Calibration'
import { FathersDayMessage } from './screens/FathersDayMessage'
import { Picks } from './screens/Picks'
import { Saved } from './screens/Saved'
import { Screening } from './screens/Screening'
import { Seen } from './screens/Seen'
import { ProfileProvider, useProfile } from './state/ProfileContext'

function MainApp() {
  const [tab, setTab] = useState<Tab>('picks')
  const [showAbout, setShowAbout] = useState(false)

  if (showAbout) return <About onBack={() => setShowAbout(false)} />

  return (
    <>
      {tab === 'picks' && <Picks onAbout={() => setShowAbout(true)} />}
      {tab === 'saved' && <Saved onAbout={() => setShowAbout(true)} />}
      {tab === 'seen' && <Seen onAbout={() => setShowAbout(true)} />}
      <TabBar active={tab} onChange={setTab} />
    </>
  )
}

// Onboarding gating is derived from the profile shape rather than a stored
// "screen" — seeds.length for Screening, !!lastPicks for Calibration (see
// lib/onboarding.ts for why Screening alone needs its own persisted flag).
function Gate() {
  const { profile } = useProfile()
  const [screeningDone, setScreeningDone] = useState(() => isScreeningDone())
  const [messageShown, setMessageShown] = useState(() => isFathersDayMessageShown())

  if (!screeningDone) {
    return (
      <Screening
        onDone={() => {
          markScreeningDone()
          setScreeningDone(true)
        }}
      />
    )
  }

  if (!messageShown) {
    return (
      <FathersDayMessage
        onContinue={() => {
          markFathersDayMessageShown()
          setMessageShown(true)
        }}
      />
    )
  }

  if (!profile.lastPicks) return <Calibration />

  return <MainApp />
}

function App() {
  return (
    <ProfileProvider>
      <Gate />
    </ProfileProvider>
  )
}

export default App
