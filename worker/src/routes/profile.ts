import type { Env } from '../env'
import { json } from '../lib/http'

const key = (deviceId: string) => `profile:${deviceId}`

// GET /profile/:deviceId — read the backup blob. The client owns the
// schema; the Worker just stores whatever JSON it's handed.
export async function getProfile(deviceId: string, env: Env): Promise<Response> {
  const stored = await env.BLUEGUM_KV.get(key(deviceId))
  if (stored === null) return json({ error: 'not found' }, 404)
  return new Response(stored, { headers: { 'content-type': 'application/json' } })
}

// PUT /profile/:deviceId — overwrite the backup blob.
export async function putProfile(deviceId: string, request: Request, env: Env): Promise<Response> {
  const body = await request.text()
  try {
    JSON.parse(body)
  } catch {
    return json({ error: 'body must be JSON' }, 400)
  }
  await env.BLUEGUM_KV.put(key(deviceId), body)
  return json({ ok: true })
}
