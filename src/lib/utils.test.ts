import { afterEach, describe, expect, it, vi } from 'vitest'

import { spaUrl } from '@/lib/utils'

describe('spaUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('prefixes SPA paths with the basename (prod: /{admin_prefix})', () => {
    vi.stubEnv('BASE_URL', '/admin-assets/')
    expect(spaUrl('/login')).toBe('/admin-assets/login')
  })

  it('handles a root basename without double slashes', () => {
    vi.stubEnv('BASE_URL', '/')
    expect(spaUrl('/login')).toBe('/login')
  })
})
