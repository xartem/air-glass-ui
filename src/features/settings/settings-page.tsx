import { useCallback, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bug, Clock, Code2, Cookie, FileText, Globe, Image, TrafficCone, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useBlocker, useNavigate, useParams } from 'react-router'

import { api, type SettingValue } from '@/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { MediaPresetsTable } from '@/components/media-presets-table'
import { MediaRegenStatus, type RegenJob } from '@/components/media-regenerate'
import { PageHeader } from '@/components/page-header'
import { PrivacyCategories, PrivacyTexts } from '@/components/privacy-settings'
import { SettingsGroupForm } from '@/components/settings-group-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

/*
 * /settings/{tab} (UI:settings §3): only the "ownerless" groups live here —
 * site · content · media · code · privacy · debug (D:settings §3, §6). Module
 * groups render the same SettingsGroupForm inside their own screens. Any
 * navigation away from a dirty form is guarded; the code tab adds a warning
 * alert and a line-diff confirm; media adds the image-presets table below.
 */

const TABS = ['site', 'content', 'media', 'code', 'privacy', 'debug'] as const
type SettingsTab = (typeof TABS)[number]

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  site: Globe,
  content: FileText,
  media: Image,
  code: Code2,
  privacy: Cookie,
  debug: Bug,
}

/** Icons for schema sub-section panels (single-section groups use the tab icon). */
const SECTION_ICONS: Record<SettingsTab, Record<string, LucideIcon>> = {
  site: { main: Globe, images: Image, datetime: Clock, mode: TrafficCone },
  content: { main: FileText },
  media: { main: Image },
  code: { main: Code2 },
  privacy: { main: Cookie },
  debug: { main: Bug },
}

/** Plain line diff: removed lines (red) then added lines (green) per key. */
function diffLines(before: string, after: string): { removed: string[]; added: string[] } {
  const beforeLines = before.split('\n').filter((line) => line.trim() !== '')
  const afterLines = after.split('\n').filter((line) => line.trim() !== '')
  return {
    removed: beforeLines.filter((line) => !afterLines.includes(line)),
    added: afterLines.filter((line) => !beforeLines.includes(line)),
  }
}

interface CodeDiff {
  key: string
  removed: string[]
  added: string[]
}

export function SettingsPage() {
  useLocale()
  const navigate = useNavigate()
  const { tab: rawTab } = useParams()
  const queryClient = useQueryClient()

  const tab: SettingsTab = TABS.includes(rawTab as SettingsTab) ? (rawTab as SettingsTab) : 'site'

  const dirtyRef = useRef(false)
  const [codeDiffs, setCodeDiffs] = useState<CodeDiff[] | null>(null)
  const codeResolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  // Presets table (media tab) joins the form's SaveBar via extraChanged (UI:media §2)
  const [presetOverrides, setPresetOverrides] = useState<string | null>(null)
  const [presetResetKey, setPresetResetKey] = useState(0)
  const [presetsConfirm, setPresetsConfirm] = useState(false)
  const presetsResolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  // Per-group variant regeneration (UI:media §2): confirm with a count, then a job.
  const [regenConfirm, setRegenConfirm] = useState<{ group: string; count: number } | null>(null)
  const [regenJob, setRegenJob] = useState<RegenJob | null>(null)

  const regenMutation = useMutation({
    mutationFn: (group: string) => api.media.regenerate.start(group),
    onSuccess: (result, group) => setRegenJob({ group, jobId: result.job_id }),
    onError: () => toast.error(t('common.request_failed')),
  })

  // Privacy panel (privacy tab) rides the same SaveBar; it writes the two json keys.
  const [privacyOverrides, setPrivacyOverrides] = useState<{ categories: string | null; texts: string | null }>({
    categories: null,
    texts: null,
  })
  const [privacyResetKey, setPrivacyResetKey] = useState(0)

  // Stable callbacks: the companion panels report overrides from an effect, so an
  // inline arrow here would re-run that effect every render (infinite loop).
  const setPrivacyCategories = useCallback(
    (categories: string | null) => setPrivacyOverrides((current) => ({ ...current, categories })),
    [],
  )
  const setPrivacyTexts = useCallback(
    (texts: string | null) => setPrivacyOverrides((current) => ({ ...current, texts })),
    [],
  )

  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
  }, [])

  // Route-level dirty-guard (UI:settings §2 "dirty-guard on leave", E4 §1):
  // covers tab switches AND leaving for another screen via the sidebar.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  function switchTab(next: string) {
    if (next !== tab) navigate(`/settings/${next}`)
  }

  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: api.settings.all, staleTime: 30_000 })
  const globalQuality = useMemo(() => {
    const media = settingsQuery.data?.groups.find((group) => group.group === 'media')
    return Number(media?.values['media.quality'] ?? 82)
  }, [settingsQuery.data])

  /** Maintenance mode switch is consequential — confirm with mode description. */
  const confirmChange = useCallback((key: string, value: SettingValue) => {
    if (key !== 'site.maintenance_mode') return null
    return {
      title: t('settings.maintenance.confirm_title'),
      description: t(`settings.maintenance.desc_${String(value)}`),
    }
  }, [])

  /** Code tab: changed code_* keys require an explicit diff confirmation. */
  const beforeSaveCode = useCallback(
    (changed: Record<string, SettingValue>): Promise<boolean> => {
      const codeKeys = Object.keys(changed).filter((key) => key.startsWith('code_'))
      if (codeKeys.length === 0) return Promise.resolve(true)
      const settings = queryClient.getQueryData<{ groups: { group: string; values: Record<string, SettingValue> }[] }>(['settings'])
      const initial = settings?.groups.find((group) => group.group === 'code')?.values ?? {}
      setCodeDiffs(
        codeKeys.map((key) => ({
          key,
          ...diffLines(String(initial[key] ?? ''), String(changed[key] ?? '')),
        })),
      )
      return new Promise((resolve) => {
        codeResolveRef.current = resolve
      })
    },
    [queryClient],
  )

  function resolveCodeConfirm(confirmed: boolean) {
    setCodeDiffs(null)
    codeResolveRef.current?.(confirmed)
    codeResolveRef.current = null
  }

  /** Media tab: changed presets require a "variants will regenerate" confirm (UI:media §2). */
  const beforeSaveMedia = useCallback((changed: Record<string, SettingValue>): Promise<boolean> => {
    if (!('media.preset_sizes' in changed)) return Promise.resolve(true)
    setPresetsConfirm(true)
    return new Promise((resolve) => {
      presetsResolveRef.current = resolve
    })
  }, [])

  function resolvePresetsConfirm(confirmed: boolean) {
    setPresetsConfirm(false)
    presetsResolveRef.current?.(confirmed)
    presetsResolveRef.current = null
  }

  // Shared: after a save/reset, drop companion edits and reload from the server.
  const onSettled = useCallback(() => {
    setPresetOverrides(null)
    setPresetResetKey((key) => key + 1)
    setPrivacyOverrides({ categories: null, texts: null })
    setPrivacyResetKey((key) => key + 1)
    void queryClient.invalidateQueries({ queryKey: ['media-presets'] })
  }, [queryClient])

  // The two json privacy keys ride the SaveBar only when actually edited.
  const privacyExtra =
    tab === 'privacy'
      ? {
          ...(privacyOverrides.categories !== null
            ? { 'privacy.consent_categories': privacyOverrides.categories }
            : {}),
          ...(privacyOverrides.texts !== null ? { 'privacy.consent_texts': privacyOverrides.texts } : {}),
        }
      : {}

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav.settings')} />
      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map((key) => {
            const Icon = TAB_ICONS[key]
            return (
              <TabsTrigger key={key} value={key}>
                <Icon className="size-4" />
                {t(`settings.tabs.${key}`)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {tab === 'code' ? (
        <Alert className="max-w-3xl border-[var(--status-pending-fg)]/40 bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]">
          <TriangleAlert className="size-4" />
          <AlertDescription className="text-[var(--status-pending-fg)]">
            {t('settings.code.warning')}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Panel sections come from the schema (UI:settings §2) — no wrapper here.
          Bottom padding clears the sticky SaveBar for the form AND companions. */}
      <div className="space-y-4 pb-24">
      <SettingsGroupForm
        key={tab}
        group={tab}
        onDirtyChange={onDirtyChange}
        confirmChange={tab === 'site' ? confirmChange : undefined}
        beforeSave={tab === 'code' ? beforeSaveCode : tab === 'media' ? beforeSaveMedia : undefined}
        monospace={tab === 'code'}
        sectionIcons={SECTION_ICONS[tab]}
        // Privacy: raw json fields → PrivacySettings. Media: S3 fields only when driver = s3.
        visibleWhen={
          tab === 'privacy'
            ? (key) => key !== 'privacy.consent_categories' && key !== 'privacy.consent_texts'
            : tab === 'media'
              ? (key, values) => !key.startsWith('media.s3.') || values['media.driver'] === 's3'
              : undefined
        }
        extraChanged={
          tab === 'media' && presetOverrides !== null
            ? { 'media.preset_sizes': presetOverrides }
            : tab === 'privacy' && Object.keys(privacyExtra).length > 0
              ? privacyExtra
              : undefined
        }
        onSettled={tab === 'media' || tab === 'privacy' ? onSettled : undefined}
        // Media: regen status beside the form (UI:media §2). Privacy: categories at 50/50 beside consent.
        aside={
          tab === 'media' ? (
            <MediaRegenStatus job={regenJob} onDone={() => setRegenJob(null)} />
          ) : tab === 'privacy' ? (
            <PrivacyCategories onOverridesChange={setPrivacyCategories} resetKey={privacyResetKey} />
          ) : undefined
        }
        asideWidth={tab === 'privacy' ? 'half' : 'fixed'}
      />

      {tab === 'media' ? (
        <MediaPresetsTable
          globalQuality={globalQuality}
          onOverridesChange={setPresetOverrides}
          resetKey={presetResetKey}
          onRegenerateGroup={(group, count) => setRegenConfirm({ group, count })}
        />
      ) : null}

      {tab === 'privacy' ? (
        <PrivacyTexts onOverridesChange={setPrivacyTexts} resetKey={privacyResetKey} />
      ) : null}
      </div>

      {/* Dirty-guard on any navigation away (tab switch or another screen) */}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
        title={t('settings.dirty.title')}
        description={t('settings.dirty.description')}
        confirmLabel={t('settings.dirty.leave')}
        destructive
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed()
        }}
      />

      {/* Presets save confirmation: variants regenerate in the background (UI:media §2) */}
      <ConfirmDialog
        open={presetsConfirm}
        onOpenChange={(open) => !open && resolvePresetsConfirm(false)}
        title={t('media.presets.confirm_title')}
        description={t('media.presets.confirm_description')}
        confirmLabel={t('common.save')}
        onConfirm={() => resolvePresetsConfirm(true)}
      />

      {/* Per-group regeneration confirm with the preset count (UI:media §2) */}
      <ConfirmDialog
        open={regenConfirm !== null}
        onOpenChange={(open) => !open && setRegenConfirm(null)}
        title={t('media.regen.confirm_title')}
        description={t('media.regen.confirm_body', {
          group: regenConfirm?.group ?? '',
          count: regenConfirm?.count ?? 0,
        })}
        confirmLabel={t('media.regen.group_button')}
        onConfirm={() => {
          if (regenConfirm) regenMutation.mutate(regenConfirm.group)
          setRegenConfirm(null)
        }}
      />

      {/* Code save confirmation with line diff (UI:settings §3) */}
      <Dialog open={codeDiffs !== null} onOpenChange={(open) => !open && resolveCodeConfirm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settings.code.confirm_title')}</DialogTitle>
            <DialogDescription>{t('settings.code.warning')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {(codeDiffs ?? []).map((diff) => (
              <div key={diff.key} className="space-y-1">
                <p className="font-mono text-xs font-medium">{diff.key}</p>
                <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-2 font-mono text-xs leading-5">
                  {diff.removed.map((line, index) => (
                    <div key={`r${index}`} className="bg-[var(--status-error-bg)] text-[var(--status-error-fg)]">
                      - {line}
                    </div>
                  ))}
                  {diff.added.map((line, index) => (
                    <div key={`a${index}`} className="bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
                      + {line}
                    </div>
                  ))}
                  {diff.removed.length === 0 && diff.added.length === 0 ? (
                    <div className="text-muted-foreground">{t('settings.code.no_visible_diff')}</div>
                  ) : null}
                </pre>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => resolveCodeConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => resolveCodeConfirm(true)}>{t('settings.code.confirm_save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
