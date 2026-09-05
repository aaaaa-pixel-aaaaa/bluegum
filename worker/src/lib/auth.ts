import type { Env } from '../env'

export function hasValidAppSecret(request: Request, env: Env): boolean {
  return request.headers.get('X-App-Secret') === env.APP_SECRET
}
