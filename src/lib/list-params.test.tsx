import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useListParams } from '@/lib/list-params'

/*
 * Regression for the "?page deep-link reset" bug: a debounce effect without
 * the `search === query` guard fired on mount and dropped the page param.
 * useListParams is the canonical list-state hook (cms-admin-ui rule) — this
 * pins its guard behavior.
 */

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/users" element={children} />
        </Routes>
      </MemoryRouter>
    )
  }
}

describe('useListParams', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('keeps the page param on mount (deep-link /users?q=иван&page=3)', () => {
    const { result } = renderHook(() => useListParams(), {
      wrapper: wrapper('/users?q=иван&page=3'),
    })
    expect(result.current.page).toBe(3)
    expect(result.current.search).toBe('иван')

    // Let any (wrong) debounce timer fire — the page must survive.
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.page).toBe(3)
    expect(result.current.query).toBe('иван')
  })

  it('typing a new search resets the page after the debounce', () => {
    const { result } = renderHook(() => useListParams(), {
      wrapper: wrapper('/users?page=3'),
    })
    act(() => result.current.setSearch('печать'))
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.query).toBe('печать')
    expect(result.current.page).toBe(1)
  })
})
