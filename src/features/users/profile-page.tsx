import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, UserCircle } from 'lucide-react'
import { toast } from 'sonner'

import { api, ValidationError } from '@/api'
import { FormField } from '@/components/form-field'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { SaveBar } from '@/components/save-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SecurityCard } from '@/features/users/mfa'
import { useAuth } from '@/lib/auth'
import { ADMIN_LOCALES, LOCALE_NAMES, setLocale, t, type AdminLocale } from '@/lib/i18n'

/*
 * /profile (UI:users-roles §2): the operator's own profile. The profile card
 * writes only name + ui_locale (mass-assignment guarded server-side); saving a
 * new UI language re-reads the dictionary immediately without a re-login. The
 * password card requires the current password (wrong → 422 under the field).
 */

export function ProfilePage() {
  const { me, refresh } = useAuth()

  const initial = useMemo(() => ({ name: me.user.name, ui_locale: me.user.ui_locale }), [me.user])
  const [name, setName] = useState(initial.name)
  const [uiLocale, setUiLocale] = useState(initial.ui_locale)

  const dirty = name !== initial.name || uiLocale !== initial.ui_locale

  const profileMutation = useMutation({
    mutationFn: () => api.profile.update({ name: name.trim(), ui_locale: uiLocale }),
    onSuccess: async () => {
      // Apply the UI language at once (SPA re-reads the dictionary, UI:users-roles §2).
      if (ADMIN_LOCALES.includes(uiLocale as AdminLocale)) setLocale(uiLocale as AdminLocale)
      toast.success(t('profile.saved'))
      await refresh()
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  return (
    <div className="space-y-4">
      <PageHeader title={t('shell.profile')} icon={UserCircle} />

      <Panel icon={UserCircle} title={t('profile.section.profile')}>
        <div className="grid max-w-2xl gap-4 md:grid-cols-2">
          <FormField name="profile-name" label={t('profile.field.name')} required className="md:col-span-2">
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField name="profile-locale" label={t('profile.field.ui_locale')}>
            <Select value={uiLocale} onValueChange={setUiLocale}>
              <SelectTrigger id="profile-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_LOCALES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LOCALE_NAMES[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="profile-email" label={t('profile.field.email')} help={t('profile.email_hint')}>
            <Input id="profile-email" value={me.user.email} readOnly disabled />
          </FormField>
        </div>
      </Panel>

      <ChangeOwnPasswordCard />

      {/* «Безопасность»: 2FA self-service (D:auth §6) */}
      <SecurityCard />

      <SaveBar
        dirty={dirty}
        saving={profileMutation.isPending}
        onSave={() => profileMutation.mutate()}
        onReset={() => {
          setName(initial.name)
          setUiLocale(initial.ui_locale)
        }}
      />
    </div>
  )
}

function ChangeOwnPasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => api.profile.changePassword({ current_password: current, password: next }),
    onSuccess: () => {
      toast.success(t('profile.password.saved'))
      setCurrent('')
      setNext('')
      setRepeat('')
      setErrors({})
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        setErrors(Object.fromEntries(Object.entries(cause.fields).map(([field, code]) => [field, t(`users.error.${code}`)])))
      } else {
        toast.error(t('common.request_failed'))
      }
    },
  })

  function submit() {
    const local: Record<string, string> = {}
    if (next.length < 8) local.password = t('users.error.password_too_short')
    if (next !== repeat) local.repeat = t('profile.password.mismatch')
    if (Object.keys(local).length > 0) {
      setErrors(local)
      return
    }
    mutation.mutate()
  }

  return (
    <Panel icon={KeyRound} title={t('profile.password.title')} description={t('profile.password.hint')}>
      <div className="grid max-w-2xl gap-4 md:grid-cols-2">
        <FormField name="current-password" label={t('profile.password.current')} required error={errors.current_password} className="md:col-span-2">
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </FormField>
        <FormField name="new-password" label={t('profile.password.new')} required error={errors.password}>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </FormField>
        <FormField name="repeat-password" label={t('profile.password.repeat')} required error={errors.repeat}>
          <Input
            id="repeat-password"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </FormField>
        <div className="md:col-span-2">
          <Button
            onClick={submit}
            disabled={mutation.isPending || !current || !next || !repeat}
          >
            {t('profile.password.submit')}
          </Button>
        </div>
      </div>
    </Panel>
  )
}
