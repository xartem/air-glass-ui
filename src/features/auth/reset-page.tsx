import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { api, ApiError } from '@/api'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

/*
 * /reset/{token} (UI:shell-auth §2): password + repeat with live match check;
 * an expired/used token switches to the invalid state with a CTA to /forgot.
 */

export function ResetPage() {
  useLocale()
  const navigate = useNavigate()
  const { token = '' } = useParams()

  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  const mismatch = repeat.length > 0 && password !== repeat

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || mismatch || password.length === 0) return
    setBusy(true)
    try {
      await api.auth.reset({ token, password })
      toast.success(t('reset.done'))
      navigate('/login', { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError && (cause.code === 'invalid_token' || cause.status === 410)) {
        setInvalidToken(true)
      } else {
        toast.error(t('common.request_failed'))
      }
    } finally {
      setBusy(false)
    }
  }

  if (invalidToken) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <KeyRound className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('reset.invalid')}</p>
          <Button asChild>
            <Link to="/forgot">{t('reset.request_new')}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-lg">{t('reset.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField name="reset-password" label={t('reset.new_password')} required>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              autoFocus
              required
            />
          </FormField>
          <FormField
            name="reset-repeat"
            label={t('reset.repeat_password')}
            required
            error={mismatch ? t('reset.mismatch') : undefined}
          >
            <Input
              id="reset-repeat"
              type="password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={busy || mismatch || password.length === 0}>
            {busy ? <Spinner /> : null}
            {t('reset.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
