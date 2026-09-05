import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Pick, Profile, Rating, Title } from '../../../shared/types'
import { fetchProfileFromKV, requestRecommend, syncProfileToKV } from '../lib/api'
import { getDeviceId } from '../lib/deviceId'
import { createEmptyProfile, knownTmdbIds, loadLocalProfile, saveLocalProfile } from '../lib/profile'

const MIN_BUFFER = 3
const SHOWN_COUNT = 5

type RefreshStatus = 'idle' | 'refreshing' | 'error'

type ProfileContextValue = {
  profile: Profile
  refreshStatus: RefreshStatus
  isGeneratingFirstPicks: boolean
  addSeed: (title: Title) => void
  removeSeed: (tmdbId: number) => void
  setCalibration: (calibration: Profile['calibration']) => void
  completeCalibration: () => Promise<void>
  refresh: () => Promise<void>
  rate: (title: Title, score: 1 | 2 | 3 | 4 | 5) => Promise<void>
  dismiss: (pick: Pick) => void
  save: (pick: Pick) => void
  removeSaved: (tmdbId: number) => void
  exportBackup: () => void
  restoreBackup: (file: File) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

function persist(profile: Profile): void {
  saveLocalProfile(profile)
  syncProfileToKV(profile)
}

function splitFresh(current: Profile, fresh: Pick[]): { shown: Pick[]; buffer: Pick[] } {
  const known = knownTmdbIds(current)
  const deduped: Pick[] = []
  const seen = new Set<number>()
  for (const pick of fresh) {
    if (known.has(pick.tmdbId) || seen.has(pick.tmdbId)) continue
    seen.add(pick.tmdbId)
    deduped.push(pick)
  }
  return { shown: deduped.slice(0, SHOWN_COUNT), buffer: deduped.slice(SHOWN_COUNT) }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle')
  const [isGeneratingFirstPicks, setIsGeneratingFirstPicks] = useState(false)
  const profileRef = useRef<Profile | null>(null)

  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const local = loadLocalProfile()
      if (local) {
        profileRef.current = local
        if (!cancelled) setProfileState(local)
        return
      }
      const deviceId = getDeviceId()
      const fromKv = await fetchProfileFromKV(deviceId)
      const resolved = fromKv ?? createEmptyProfile()
      profileRef.current = resolved
      saveLocalProfile(resolved)
      if (!cancelled) setProfileState(resolved)
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback((updater: (p: Profile) => Profile) => {
    setProfileState((prev) => {
      if (!prev) return prev
      const next = updater(prev)
      profileRef.current = next
      persist(next)
      return next
    })
  }, [])

  const addSeed = useCallback(
    (title: Title) => {
      update((p) => {
        if (p.seeds.length >= 10) return p
        if (p.seeds.some((s) => s.tmdbId === title.tmdbId)) return p
        return { ...p, seeds: [...p.seeds, title] }
      })
    },
    [update]
  )

  const removeSeed = useCallback(
    (tmdbId: number) => {
      update((p) => ({ ...p, seeds: p.seeds.filter((s) => s.tmdbId !== tmdbId) }))
    },
    [update]
  )

  const setCalibration = useCallback(
    (calibration: Profile['calibration']) => {
      update((p) => ({ ...p, calibration }))
    },
    [update]
  )

  const completeCalibration = useCallback(async () => {
    if (!profileRef.current) return
    setIsGeneratingFirstPicks(true)
    const fresh = await requestRecommend(profileRef.current)
    if (fresh && profileRef.current) {
      const { shown, buffer } = splitFresh(profileRef.current, fresh)
      update((p) => ({ ...p, lastPicks: { generatedAt: new Date().toISOString(), shown, buffer } }))
    }
    setIsGeneratingFirstPicks(false)
  }, [update])

  // Full regenerate: replaces the whole shown row and buffer, with the
  // fade-in motion on the client side once it lands. Triggered only by an
  // explicit refresh or a new rating — see BRIEF.md §5.
  const runFullRegenerate = useCallback(async () => {
    if (!profileRef.current) return
    setRefreshStatus('refreshing')
    const fresh = await requestRecommend(profileRef.current)
    if (fresh && profileRef.current) {
      const { shown, buffer } = splitFresh(profileRef.current, fresh)
      update((p) => ({ ...p, lastPicks: { generatedAt: new Date().toISOString(), shown, buffer } }))
      setRefreshStatus('idle')
    } else {
      setRefreshStatus('error')
    }
  }, [update])

  const refresh = useCallback(() => runFullRegenerate(), [runFullRegenerate])

  // Silent top-up: tops `shown` back to five from `buffer`, then refills the
  // buffer in the background. No loading UI, no animation — this is
  // finishing a row that was already on screen, not loading a new set.
  const topUpBuffer = useCallback(async () => {
    const before = profileRef.current
    if (!before?.lastPicks) return
    const fresh = await requestRecommend(before)
    if (!fresh) return
    const latest = profileRef.current
    if (!latest?.lastPicks) return

    const known = knownTmdbIds(latest)
    const existingIds = new Set([
      ...latest.lastPicks.shown.map((p) => p.tmdbId),
      ...latest.lastPicks.buffer.map((p) => p.tmdbId),
    ])
    const additions = fresh.filter((p) => !known.has(p.tmdbId) && !existingIds.has(p.tmdbId))
    if (additions.length === 0) return

    update((p) => {
      if (!p.lastPicks) return p
      const shown = [...p.lastPicks.shown]
      const pool = [...additions]
      while (shown.length < SHOWN_COUNT && pool.length > 0) shown.push(pool.shift() as Pick)
      return { ...p, lastPicks: { ...p.lastPicks, shown, buffer: [...p.lastPicks.buffer, ...pool] } }
    })
  }, [update])

  // Clears one slot from `shown`, backfills it from `buffer`, and tops the
  // buffer up in the background once it runs low. Shared by dismiss, save,
  // and rate — see BRIEF.md §7.
  const clearSlot = useCallback(
    (tmdbId: number) => {
      let bufferAfter = 0
      update((p) => {
        if (!p.lastPicks) return p
        const shown = p.lastPicks.shown.filter((s) => s.tmdbId !== tmdbId)
        const buffer = [...p.lastPicks.buffer]
        if (shown.length < SHOWN_COUNT && buffer.length > 0) shown.push(buffer.shift() as Pick)
        bufferAfter = buffer.length
        return { ...p, lastPicks: { ...p.lastPicks, shown, buffer } }
      })
      if (bufferAfter < MIN_BUFFER) void topUpBuffer()
    },
    [update, topUpBuffer]
  )

  const rate = useCallback(
    async (title: Title, score: 1 | 2 | 3 | 4 | 5) => {
      update((p) => {
        const rating: Rating = { ...title, score, ratedAt: new Date().toISOString() }
        const ratings = p.ratings.filter((r) => r.tmdbId !== title.tmdbId)
        return { ...p, ratings: [...ratings, rating] }
      })
      clearSlot(title.tmdbId)
      await runFullRegenerate()
    },
    [update, clearSlot, runFullRegenerate]
  )

  const dismiss = useCallback(
    (pick: Pick) => {
      update((p) => ({ ...p, dismissed: [...p.dismissed, pick.tmdbId] }))
      clearSlot(pick.tmdbId)
    },
    [update, clearSlot]
  )

  const save = useCallback(
    (pick: Pick) => {
      const { reason: _reason, ...title } = pick
      update((p) => ({ ...p, saved: [...p.saved, title] }))
      clearSlot(pick.tmdbId)
    },
    [update, clearSlot]
  )

  const removeSaved = useCallback(
    (tmdbId: number) => {
      update((p) => ({ ...p, saved: p.saved.filter((s) => s.tmdbId !== tmdbId) }))
    },
    [update]
  )

  const exportBackup = useCallback(() => {
    if (!profileRef.current) return
    const blob = new Blob([JSON.stringify(profileRef.current, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bluegum-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const restoreBackup = useCallback(async (file: File) => {
    const text = await file.text()
    const parsed = JSON.parse(text) as Profile
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1 || !Array.isArray(parsed.seeds)) {
      throw new Error("That file doesn't look like a Bluegum backup.")
    }
    profileRef.current = parsed
    setProfileState(parsed)
    persist(parsed)
  }, [])

  if (!profile) {
    return <div className="min-h-svh bg-paper" />
  }

  const value: ProfileContextValue = {
    profile,
    refreshStatus,
    isGeneratingFirstPicks,
    addSeed,
    removeSeed,
    setCalibration,
    completeCalibration,
    refresh,
    rate,
    dismiss,
    save,
    removeSaved,
    exportBackup,
    restoreBackup,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
