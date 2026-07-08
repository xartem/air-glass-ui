import { useEffect, useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'

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
import { generatePassword } from '@/lib/password'
import { t } from '@/lib/i18n'

/*
 * ChangePasswordDialog (UI:users-roles §3): set a new password for another user
 * from the list "⋯". The value is shown in clear text (there is no email reset)
 * with a generator and copy button; confirming revokes the target's sessions.
 * Controlled — the caller owns open state and performs the API call in onConfirm.
 */

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userName,
  saving = false,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  saving?: boolean
  /** Per-field server error (e.g. password_too_short), already translated. */
  error?: string
  onConfirm: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  // Reset the field each time the dialog opens for a fresh target.
  useEffect(() => {
    if (open) {
      setPassword('')
      setCopied(false)
    }
  }, [open])

  async function copy() {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.password.title', { name: userName })}</DialogTitle>
          <DialogDescription>{t('users.password.hint')}</DialogDescription>
        </DialogHeader>
        <FormField name="new-password" label={t('users.password.new')} error={error}>
          <div className="flex items-center gap-2">
            <Input
              id="new-password"
              value={password}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="button" variant="outline" size="icon" aria-label={t('users.password.copy')} onClick={() => void copy()}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
        </FormField>
        <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setPassword(generatePassword())}>
          <RefreshCw />
          {t('users.password.generate')}
        </Button>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => onConfirm(password)} disabled={saving || password.length === 0}>
            {t('users.password.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
