import { useCallback, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bot, CircleDollarSign, Plug, PlugZap, ScrollText, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useBlocker } from 'react-router'

import { api, type SettingValue } from '@/api'
import { AiFindingsPanel } from '@/features/ai/ai-findings-panel'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { SettingsGroupForm } from '@/components/settings-group-form'
import { toast } from '@/components/toast'
import { ChartCard } from '@/components/widget-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

/*
 * /system/ai (UI:ai §4, perm ai.manage): SettingsGroupForm(ai) with the
 * provider-dependent fields (only the active provider's key; base URL only for
 * openai-compatible), «Проверить подключение», the daily spend ChartCard and
 * the log-triage findings section (D:ai §4c).
 */

const SECTION_ICONS: Record<string, LucideIcon> = {
  provider: Bot,
  limits: CircleDollarSign,
  categories: ShieldCheck,
  mcp: Plug,
  triage: ScrollText,
}

function AiSpendChart() {
  const spendQuery = useQuery({ queryKey: ['ai', 'spend'], queryFn: api.ai.spend })
  if (spendQuery.isPending) return <Skeleton className="h-[264px] rounded-2xl" />
  if (spendQuery.isError) {
    return (
      <Panel title={t('ai.spend.title')} icon={CircleDollarSign}>
        <EmptyState
          title={t('common.request_failed')}
          action={{ label: t('common.retry'), onClick: () => void spendQuery.refetch() }}
        />
      </Panel>
    )
  }
  return (
    <ChartCard
      title={t('ai.spend.title')}
      size="md"
      data={{
        kind: 'bar',
        series: [
          {
            label_key: 'ai.spend.series',
            points: spendQuery.data.series.map((point) => ({ x: point.date, y: point.cost })),
          },
        ],
      }}
    />
  )
}

export function AiSettingsPage() {
  useLocale()
  const [testing, setTesting] = useState(false)
  const dirtyRef = useRef(false)

  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty
  }, [])

  // Route-level dirty-guard, same contract as /settings (E4 §1)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  /** Only the ACTIVE provider's key; base URL only for openai-compatible (UI:ai §4). */
  const visibleWhen = useCallback((key: string, values: Record<string, SettingValue>) => {
    const provider = String(values['ai.provider'] ?? 'claude')
    if (key === 'ai.base_url') return provider === 'openai-compatible'
    if (key.startsWith('ai.api_key.')) return key === `ai.api_key.${provider}`
    return true
  }, [])

  async function testConnection() {
    setTesting(true)
    try {
      const result = await api.ai.test()
      if (result.ok) toast.success(t('ai.settings.test_ok'))
      else toast.error(t('ai.settings.test_fail'))
    } catch {
      toast.error(t('common.request_failed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={t('nav.aiSettings')}
        icon={Bot}
        secondaryActions={[
          {
            label: t('ai.settings.test'),
            icon: <PlugZap />,
            onClick: () => void testConnection(),
            disabled: testing,
          },
        ]}
      />

      <SettingsGroupForm
        group="ai"
        onDirtyChange={onDirtyChange}
        sectionIcons={SECTION_ICONS}
        visibleWhen={visibleWhen}
      />

      <AiSpendChart />

      <AiFindingsPanel />

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
    </div>
  )
}
