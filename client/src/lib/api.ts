import type { Pick, Profile } from '../../../shared/types'
import { getDeviceId } from './deviceId'

export const WORKER_URL = import.meta.env.VITE_WORKER_URL as string
const APP_SECRET = import.meta.env.VITE_APP_SECRET as string

export function workerHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    'X-App-Secret': APP_SECRET,
    'X-Device-Id': getDeviceId(),
    ...extra,
  }
}

// POST /recommend — returns whatever grounded picks survived (up to 12), or
// null if the call failed or Claude's response couldn't be parsed even
// after the Worker's own retry. The caller decides what "null" means for
// the screen it's on (keep cached picks, show a quiet note, etc).
export async function requestRecommend(profile: Profile): Promise<Pick[] | null> {
  try {
    const response = await fetch(`${WORKER_URL}/recommend`, {
      method: 'POST',
      headers: workerHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { picks: Pick[] }
    return data.picks
  } catch {
    return null
  }
}

export async function fetchProfileFromKV(deviceId: string): Promise<Profile | null> {
  try {
    const response = await fetch(`${WORKER_URL}/profile/${deviceId}`, { headers: workerHeaders() })
    if (!response.ok) return null
    return (await response.json()) as Profile
  } catch {
    return null
  }
}

// Fire-and-forget by design (BRIEF.md §4): never blocks the UI, never
// surfaces an error if it fails. localStorage is the primary store.
export function syncProfileToKV(profile: Profile): void {
  fetch(`${WORKER_URL}/profile/${profile.deviceId}`, {
    method: 'PUT',
    headers: workerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profile),
  }).catch(() => {})
}
