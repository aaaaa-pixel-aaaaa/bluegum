// Screening completion is tracked separately from the synced Profile blob
// (BRIEF.md §4 doesn't include it) because it's pure client-side navigation
// state: once seeds.length reaches 5 the "Done" button becomes tappable,
// but the screen shouldn't jump away on its own — the viewer may still want
// to add up to ten. Calibration's completion doesn't need an equivalent
// flag: `!!profile.lastPicks` already answers it reliably.
const KEY = 'bluegum:screeningDone'

export function isScreeningDone(): boolean {
  return localStorage.getItem(KEY) === 'true'
}

export function markScreeningDone(): void {
  localStorage.setItem(KEY, 'true')
}
