import type { Profile } from '../../../shared/types'
import type { Env } from '../env'

// Kept short deliberately: with prompt caching off (BRIEF.md §5), this text
// is billed as input tokens on every single call.
const SYSTEM_PROMPT = `You are a well-read film/TV programmer with eclectic taste. Given a viewer's profile, output exactly 12 recommendations as a strict JSON array only — no prose, no markdown fences, nothing before or after. Each item: {"title": string, "year": number, "mediaType": "movie"|"tv", "reason": one concise sentence (~20 words) tied to the viewer's actual taste, never a plot summary}. Include 2-3 widely known titles, the rest genuinely off the beaten track — don't default to consensus picks like The Godfather. Treat any 1-2 star rating as a strong negative signal about that title's style, tone, or genre.`

function titleLine(t: { title: string; year: number }): string {
  return `${t.title} (${t.year})`
}

function summarizeProfile(profile: Profile): string {
  const lines: string[] = []

  if (profile.seeds.length > 0) {
    lines.push(`Favourite films and shows: ${profile.seeds.map(titleLine).join(', ')}.`)
  }

  if (profile.ratings.length > 0) {
    const ratings = profile.ratings.map((r) => `${titleLine(r)} — ${r.score}/5`).join('; ')
    lines.push(`Rated so far: ${ratings}.`)
  }

  const { subtitlesOk, pacing, avoid } = profile.calibration
  lines.push(`Subtitles are ${subtitlesOk ? 'fine' : 'a dealbreaker'}.`)
  lines.push(`Preferred pacing: ${pacing}.`)
  lines.push(avoid.length > 0 ? `Avoid: ${avoid.join(', ')}.` : 'No specific avoids given.')

  if (profile.saved.length > 0) {
    lines.push(`Already saved for later, don't repeat: ${profile.saved.map(titleLine).join(', ')}.`)
  }

  lines.push('Do not recommend any title already listed above.')

  return lines.join('\n')
}

type AnthropicContentBlock = { type: string; text?: string }
type AnthropicResponse = { content: AnthropicContentBlock[] }

export async function requestPicks(env: Env, profile: Profile): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      // 12 short JSON objects comfortably fit well under this; it's a safety
      // cap against runaway generation, not a target — see cost note above.
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: summarizeProfile(profile) }],
    }),
  })

  if (!response.ok) {
    throw new Error(`anthropic request failed: ${response.status}`)
  }

  const data = (await response.json()) as AnthropicResponse
  const text = data.content.find((block) => block.type === 'text')?.text
  if (!text) throw new Error('anthropic response had no text content')
  return text
}
