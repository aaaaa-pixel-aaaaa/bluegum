# Bluegum — Build Brief

A personal film and TV recommendation app for one user. Installed to an iPhone
home screen via Safari's "Add to Home Screen". No App Store, no native code.

**Read this entire file before writing any code. If anything is ambiguous, ask
me rather than guessing.**

---

## 1. What it does

1. **Screening.** On first run the user names around ten favourite films or
   shows and answers three short questions. This is his taste profile.
2. **Recommends.** Shows five picks, each with a poster and one sentence on why
   he'll like it.
3. **Learns.** He marks things seen, rates them, or says "not for me". The next
   set of picks reflects that.

Success looks like: he opens it, sees five things, and at least one makes him
say "oh, I've been meaning to watch that."

The reason line is the product. A poster grid without it is worthless. Treat
that sentence as the most important thing on the screen.

---

## 2. Stack

- Vite + React + TypeScript, Tailwind
- Deployed to GitHub Pages via GitHub Actions on push to `main`
- Cloudflare Worker as API proxy and storage — deployed manually via
  `wrangler deploy` from a local machine. No CI for the Worker, no Cloudflare
  credentials stored in GitHub secrets.
- Cloudflare Workers KV for profile backup
- TMDB for catalogue data, posters, and search
- Anthropic API (`claude-haiku-4-5-20251001`) for the recommendations themselves

No service worker. The app needs network anyway, and cache invalidation on iOS
will cost more time than offline support is worth.

---

## 3. Architecture

```
iPhone (PWA)  ──►  Cloudflare Worker  ──►  TMDB API
                          │            └─►  Anthropic API
                          └──────────────►  Workers KV
```

The client holds no API keys.

### Worker endpoints

| Route | Purpose |
|---|---|
| `GET /tmdb/*` | Pass-through proxy to TMDB, injects bearer token |
| `POST /recommend` | Takes the profile, calls Claude, returns picks |
| `GET /profile/:deviceId` | Reads profile blob from KV |
| `PUT /profile/:deviceId` | Writes profile blob to KV |

### Worker security

- Require an `X-App-Secret` header on every route. Reject anything without it.
  This is not real auth; it stops drive-by abuse of a public URL. Note that
  because the client is a static bundle on GitHub Pages, this secret ships in
  plain text in the shipped JS — it deters casual scripted hits, nothing more.
- Rate limit per `deviceId` in KV with a TTL: 20/hour on `/recommend`,
  200/hour on `/tmdb/*`.
- Additionally rate limit `/recommend` per IP address (`CF-Connecting-IP`),
  20/hour, tracked independently of the deviceId limit. `deviceId` is
  client-supplied and the app secret is public, so a deviceId-only limit can
  be dodged by rotating deviceIds. The IP cap is the real backstop protecting
  the Anthropic bill.
- Never log or return the API keys.

### Secrets — all via `wrangler secret put`, never committed

- `TMDB_READ_TOKEN` — TMDB v4 read access token
- `ANTHROPIC_API_KEY`
- `APP_SECRET` — random string, also injected into the client at build time

---

## 4. Data model

One JSON blob, written to `localStorage` on every change and mirrored to KV.
It is a few kilobytes. Do not over-engineer this.

```ts
type Profile = {
  deviceId: string;          // uuid, generated on first run
  version: 1;
  seeds: Title[];            // the screening picks
  calibration: {
    subtitlesOk: boolean;
    pacing: 'patient' | 'either' | 'brisk';
    avoid: string[];         // labels from the tappable chip set, see §7
  };
  ratings: Rating[];
  saved: Title[];            // saved for later, not yet watched
  dismissed: number[];       // tmdb ids never to show again
  lastPicks?: {
    generatedAt: string;
    shown: Pick[];            // currently on screen, up to 5
    buffer: Pick[];           // grounded survivors not yet shown — see §5
  };
};

type Title  = { tmdbId: number; mediaType: 'movie' | 'tv'; title: string; year: number; posterPath: string | null };
type Rating = Title & { score: 1|2|3|4|5; ratedAt: string };
type Pick   = Title & { reason: string };
```

### Sync rules

- On launch: read local. If empty, try KV and hydrate from it.
- On every change: write local immediately, then fire-and-forget to KV.
- If the KV write fails, do not block the UI and do not show an error.
- Also provide "Export a backup" (downloads the JSON) and "Restore a backup"
  (file picker). Escape hatch only, not the primary mechanism.

---

## 5. How recommendations work

One Claude call per generation. No local scoring engine, no candidate
pipeline.

**Step 1.** Build a compact text summary of the profile: the seeds with years,
the ratings with scores, the calibration answers, and the titles already seen,
saved, or dismissed.

**Step 2.** Send it to Claude with a system prompt establishing it as a
well-read film programmer who makes specific, non-obvious recommendations and
explains them in one plain sentence. Ask for **twelve** picks as strict JSON —
no prose, no markdown fences — each with title, year, media type, and reason.

**Step 3.** Resolve each of the twelve returned titles against TMDB search by
title and year. Silently drop anything with no confident match. This is the
grounding step: it means a hallucinated film never reaches the screen. If
fewer than five survive, show what survived — do not retry the Claude call on
account of grounding shortfall (the malformed-JSON retry in Step 6 is a
separate case).

**Step 4.** Show the first five survivors on Picks. Keep the rest as a buffer
in `lastPicks.buffer`.

**Step 5.** Generation (a real Claude call) only happens when:
  - a new rating is submitted, or
  - the user hits explicit refresh, or
  - the buffer drops below 3 (checked automatically whenever a slot is
    cleared; this refill happens silently in the background, the same way a
    KV write does — no spinner, no user action).

  Never on plain app open.

**Step 6.** Acting on a pick — "Seen it" (after rating), "Not for me", or
"Save for later" — clears that slot from `shown` and pulls the next item from
`buffer` to replace it. This does **not** call Claude, except that submitting
a rating separately satisfies the Step 5 rating trigger and starts a real
generation afterward. Parse defensively: if the JSON from a generation is
malformed, retry the call once, then show the cached `shown` picks with a
quiet note that it couldn't refresh.

Prompt requirements:
- Explicitly exclude everything in seeds, ratings, saved, and dismissed.
- Ask for a mix: two or three widely known, the rest genuinely off the beaten
  track. Otherwise it recommends *The Godfather* to everyone.
- A 1 or 2 star rating is a strong signal. Say so in the prompt.
- Reasons must reference his actual taste, not the film's plot. "You rated
  three Sidney Lumet films highly and this is the one everybody forgets" beats
  "A gripping courtroom drama."

---

## 6. Design system

The name is Bluegum, after *Eucalyptus globulus*. Every choice below comes off
the actual tree. Follow it exactly.

### Colour

| Token | Hex | Where it comes from | Use |
|---|---|---|---|
| `paper` | `#EEF2EC` | Trunk under shed bark — cool white with a green cast | Page background |
| `bloom` | `#CBD8CE` | Waxy glaucous bloom on juvenile leaves | Dividers, inactive states, the stem |
| `glaucous` | `#7C9A94` | Blue-grey of new growth | Secondary accent, rating marks |
| `sickle` | `#3A5140` | Adult leaf, deep grey-green | Primary buttons, active states |
| `heartwood` | `#17231B` | Deepest leaf shadow | All text |

This is a **cool** white. It must not drift warm. Do not use `#F4F1EA` or any
cream, and no terracotta, clay, or amber accents anywhere.

### Type

- **Newsreader** (variable, Google Fonts) — film titles, the reason lines, and
  the screening questions. Use the optical size axis. The reason line is set at
  21px and is the visual centre of the screen.
- **Archivo** (variable, Google Fonts) — buttons, labels, everything else.
- Base size 17px minimum. He is in his sixties and will not fetch his glasses.
- Scale: 17 / 21 / 27 / 33 / 42.
- Sentence case everywhere. No all-caps labels.

### Layout — the hanging branch

Eucalypt leaves hang vertically, which is why gum forests cast such thin shade.
Posters are vertical too. The main screen is a single column with a 1px `bloom`
stem running down the centre, posters alternating slightly left and right of it
in rank order, like alternate leaves on a branch.

```
        │
   ┌────┴──┐
   │poster │        Title, 1974
   └───────┘        Newsreader 21px reason line
        │           running to about 60 characters,
        │           given room to breathe.
        │
        │       ┌───────┐
   Title, 1998   │poster │
   Reason line   └───┬───┘
        │
```

- Single column, generous vertical rhythm, roughly 64px between picks.
- Posters keep their native rectangular corners. No border radius, no shadow,
  no card, no container. They sit directly on the paper.
- Radius rule, no exceptions: pills on buttons, native square corners on
  posters, nothing else is rounded.
- Line length under 60 characters for the serif.
- The same stem carries the poster thumbnails during screening, so onboarding
  and the main screen are visibly the same place.

### App icon

A single sickle eucalypt leaf silhouette: `paper` leaf on a `sickle`
background. No text, no other colours, no gradient. It has to read clearly at
60px on a home screen — draw it simpler than feels necessary. No veins, no
serration, no fine detail that disappears at that size.

### Motion

One orchestrated moment: when a new set of picks loads, they fade in down the
stem in sequence, top to bottom, over about 600ms total. Once. Everything else
is response to a tap only. Respect `prefers-reduced-motion`.

### What not to do

No cards with uniform border radius and a soft grey shadow. No gradient
washes. No all-caps eyebrow labels above headings. No arrows appended to
button text. No skeleton loaders that flash. No hover-dependent behaviour —
this is a touch device.

---

## 7. Screens

1. **Screening.** Opens on a Newsreader question, large: *"Name ten films
   you'd defend at a dinner party."* Search-as-you-type below it. Tapping a
   result adds a poster thumbnail to the stem. "Done" enables at five picks;
   don't force ten.
2. **Calibration.** Three questions, one per screen, large tappable answers,
   skippable. Subtitles and pacing are simple choices. "Anything he'd never
   watch" is a bank of about ten tappable chips covering genre and mood —
   multi-select, no keyboard, chip labels populate `avoid` directly:
   Horror, Musicals, Reality TV, True crime, Broad comedy, Romance-forward,
   Anime, Slow / arthouse pacing, High violence or gore, Long prestige dramas
   (multi-season commitment).
3. **Picks.** The home screen. The hanging branch. Each pick offers "Seen it"
   (opens rating), "Not for me" (dismiss), "Save for later". All three clear
   that slot and pull the next candidate from the buffer (see §5) — no Claude
   call, except that a submitted rating separately triggers a real
   generation. A manual refresh action is always available and always calls
   Claude regardless of buffer state.
4. **Saved.** What he's kept but not watched.
5. **Seen.** What he's rated, with the option to change a score.
6. **About.** TMDB attribution, backup and restore.

Bottom tab bar for Picks, Saved, Seen. No hamburger, no nested navigation.

### Copy

Plain and slightly dry. Buttons say exactly what happens and keep the same word
through the flow. Empty states are invitations, not apologies: *"Nothing saved
yet. Anything you keep turns up here."*

---

## 8. iOS requirements

- `manifest.json` with `display: "standalone"`, name, short_name,
  `theme_color: "#EEF2EC"`, `background_color: "#EEF2EC"`
- Repo is `bluegum`, served as a GitHub Pages project subpath, no custom
  domain. Three values must always agree: Vite's `base`, the manifest's
  `start_url`, and the manifest's `scope` — all `/bluegum/`. **Flag it
  immediately if these three ever drift apart** — a mismatch here is the most
  common way a GitHub Pages PWA silently fails to launch in standalone mode.
- Icons at 180×180 (apple-touch-icon), 192×192, 512×512
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `viewport-fit=cover` in the viewport meta
- Honour `env(safe-area-inset-*)`. The tab bar must clear the home indicator.
- Minimum 44×44pt tap targets

---

## 9. Attribution — required

TMDB's licence requires it. On the About screen, with the TMDB logo:

> This product uses the TMDB API but is not endorsed or certified by TMDB.

Non-negotiable. It is a condition of the free non-commercial licence.

---

## 10. Build order

Three phases. Do not start a phase until the previous one is deployed and
verified.

**Phase A — shell.** Scaffold, GitHub Action, PWA manifest, icons, safe-area
handling. The app renders one line of text. Install it on a real iPhone and
verify standalone mode before continuing.

**Phase B — Worker.** TMDB proxy, app secret check, both rate limits
(deviceId and IP). `/recommend` and the profile routes stubbed. Verify with
curl.

**Phase C — everything else.** Screening, calibration, `/recommend`, picks
screen, rating loop, KV sync, export/restore, About screen. Build it all,
then walk through what was built.

---

## 11. Constraints

- No analytics, no tracking, no third-party scripts beyond Google Fonts.
- No accounts, no login. The deviceId is the only identity.
- Minimal dependencies. Every package is one I maintain in eighteen months
  when he asks why it stopped working.
- Tests: Vitest on the recommendation JSON-parsing-and-TMDB-grounding
  function only. No component tests, no Worker route tests.
- Commit after every step with a clear message.
