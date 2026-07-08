import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api'
import { createQueryClient, shouldRetryQuery } from '@/lib/query'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

describe('shouldRetryQuery', () => {
  it('never retries 4xx ApiErrors (403/404/422 are final)', () => {
    for (const status of [403, 404, 409, 422, 429]) {
      expect(shouldRetryQuery(0, new ApiError(status, 'nope'))).toBe(false)
    }
  })

  it('retries 5xx and network errors up to two times', () => {
    expect(shouldRetryQuery(0, new ApiError(500, 'boom'))).toBe(true)
    expect(shouldRetryQuery(1, new TypeError('failed to fetch'))).toBe(true)
    expect(shouldRetryQuery(2, new ApiError(500, 'boom'))).toBe(false)
  })
})

describe('createQueryClient mutation error safety net', () => {
  it('toasts errors only for mutations without their own onError', async () => {
    const { toast } = await import('sonner')
    const client = createQueryClient()
    const onError = client.getMutationCache().config.onError
    expect(onError).toBeTypeOf('function')

    const error = new ApiError(500, 'server exploded')
    const handled = { options: { onError: () => undefined } }
    const unhandled = { options: {} }

    // @ts-expect-error -- narrow stub instead of a full Mutation instance
    onError?.(error, undefined, undefined, handled)
    expect(toast.error).not.toHaveBeenCalled()

    // @ts-expect-error -- narrow stub instead of a full Mutation instance
    onError?.(error, undefined, undefined, unhandled)
    expect(toast.error).toHaveBeenCalledWith('server exploded')
  })
})
