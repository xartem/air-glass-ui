import type { ReactNode } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'

import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MfaEnrollFlow } from '@/features/users/mfa'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'

/*
 * Forced 2FA enroll (D:auth §3, §6): a role listed in security.mfa_required_roles
 * without confirmed 2FA never reaches the shell — this gate replaces it with the
 * enroll flow until 2FA is on. The only other way out is logging out.
 */

export function MfaEnrollGate({ children }: { children: ReactNode }) {
  const { me, refresh } = useAuth()

  if (!me.mfa.enroll_required) return <>{children}</>

  async function logout() {
    await api.auth.logout()
    window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/login`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 pt-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-6" />
            </span>
            <CardTitle className="text-lg">{t('mfa.enroll_required_title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('mfa.enroll_required_hint')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MfaEnrollFlow onDone={() => void refresh()} />
          <p className="text-center">
            <Button variant="link" size="sm" onClick={() => void logout()}>
              <LogOut className="size-3.5" />
              {t('shell.logout')}
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
