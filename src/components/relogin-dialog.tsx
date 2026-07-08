import { useEffect, useState, type FormEvent } from 'react'

import { api, ApiError, onReloginRequired, resumeAfterRelogin } from '@/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/auth'
import { spaUrl } from '@/lib/utils'
import { t } from '@/lib/i18n'

/*
 * Re-login dialog (UI:shell-auth §2, E2 §5): opens when any request hits 401
 * mid-session. The failed request is parked by the api client and retried after
 * a successful login — unsaved screen state is never lost. Closing by clicking
 * outside is disabled: the session is gone, the user must decide.
 */

export function ReloginDialog() {
  const { me } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmSwitch, setConfirmSwitch] = useState(false)
  // [FIX] 2FA users got an endless 401 loop: relogin returned { mfa_required }
  // which was treated as success. Mirror the login-page two-step flow instead.
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  useEffect(() => onReloginRequired(() => setOpen(true)), [])

  function finish() {
    setPassword('')
    setMfaCode('')
    setMfaStep(false)
    setOpen(false)
    resumeAfterRelogin()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mfaStep) {
        await api.auth.challenge2fa(mfaCode.trim())
        finish()
        return
      }
      const result = await api.auth.relogin({ email: me.user.email, password, remember: false })
      if ('mfa_required' in result) {
        if (import.meta.env.DEV) console.debug('[FIX] relogin requires 2FA challenge')
        setMfaStep(true)
        return
      }
      finish()
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.code === 'throttled'
          ? t('login.throttled')
          : t(mfaStep ? 'login.invalid_code' : 'relogin.invalid'),
      )
    } finally {
      setBusy(false)
    }
  }

  function switchUser() {
    // Full redirect (the session is gone) — /login lives under the SPA basename.
    window.location.assign(spaUrl('/login'))
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined /* explicit choice only */}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('relogin.title')}</DialogTitle>
            <DialogDescription>{t('relogin.description')}</DialogDescription>
          </DialogHeader>
          <FormField name="relogin-email" label={t('login.email')}>
            <Input id="relogin-email" value={me.user.email} disabled autoComplete="username" />
          </FormField>
          {mfaStep ? (
            <FormField name="relogin-mfa" label={t('login.mfa_code')} help={t('login.mfa_hint')} error={error ?? undefined}>
              <Input
                id="relogin-mfa"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                autoFocus
              />
            </FormField>
          ) : (
            <FormField name="relogin-password" label={t('login.password')} error={error ?? undefined}>
              <Input
                id="relogin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </FormField>
          )}
          <DialogFooter className="items-center sm:justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmSwitch(true)}>
              {t('relogin.switch_user')}
            </Button>
            <Button type="submit" disabled={busy || (mfaStep ? mfaCode.trim().length === 0 : password.length === 0)}>
              {busy ? <Spinner /> : null}
              {t('login.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmDialog
        open={confirmSwitch}
        onOpenChange={setConfirmSwitch}
        title={t('relogin.switch_user')}
        description={t('relogin.switch_confirm')}
        confirmLabel={t('relogin.switch_user')}
        onConfirm={switchUser}
      />
    </Dialog>
  )
}
