import { act, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * Regression for the 2FA re-login loop: `relogin` answering { mfa_required }
 * was treated as success, the dialog closed and parked requests looped on 401.
 * The dialog must switch to the code step and resume only after challenge2fa.
 */

let triggerRelogin: () => void = () => undefined
const relogin = vi.fn()
const challenge2fa = vi.fn()
const resumeAfterRelogin = vi.fn()

vi.mock('@/api', () => ({
  api: { auth: { relogin: (...args: unknown[]) => relogin(...args), challenge2fa: (...args: unknown[]) => challenge2fa(...args) } },
  ApiError: class ApiError extends Error {
    status: number
    code?: string
    constructor(status: number, message: string, code?: string) {
      super(message)
      this.status = status
      this.code = code
    }
  },
  onReloginRequired: (cb: () => void) => {
    triggerRelogin = cb
    return () => undefined
  },
  resumeAfterRelogin: () => resumeAfterRelogin(),
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ me: { user: { email: 'admin@demo.test' } } }),
}))

import { ReloginDialog } from '@/components/relogin-dialog'

describe('ReloginDialog 2FA flow', () => {
  beforeEach(() => {
    relogin.mockReset()
    challenge2fa.mockReset()
    resumeAfterRelogin.mockReset()
  })

  it('switches to the code step on mfa_required and resumes only after the challenge', async () => {
    relogin.mockResolvedValue({ mfa_required: true })
    challenge2fa.mockResolvedValue({ ok: true })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ReloginDialog />
      </MemoryRouter>,
    )
    act(() => triggerRelogin())

    const submit = () => document.querySelector('button[type="submit"]') as HTMLElement
    await user.type(document.getElementById('relogin-password') as HTMLElement, 'password')
    await user.click(submit())

    // mfa_required → the dialog must NOT resume; the code field appears instead.
    await waitFor(() => expect(document.getElementById('relogin-mfa')).toBeTruthy())
    expect(resumeAfterRelogin).not.toHaveBeenCalled()

    await user.type(document.getElementById('relogin-mfa') as HTMLElement, '123456')
    await user.click(submit())

    await waitFor(() => expect(challenge2fa).toHaveBeenCalledWith('123456'))
    await waitFor(() => expect(resumeAfterRelogin).toHaveBeenCalledTimes(1))
  })
})
