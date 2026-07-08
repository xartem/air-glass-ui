import { Construction } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Panel } from '@/components/panel'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

/*
 * Placeholder for routes whose screens land in later build-order stages
 * (spec/admin/01-build-order.md). Keeps the sidebar and ⌘K palette fully
 * navigable from day one.
 */

export function PlaceholderPage({ titleKey, stage }: { titleKey: string; stage: number }) {
  useLocale()
  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <Panel contentClassName="py-10">
        <EmptyState
          icon={Construction}
          title={t('placeholder.title')}
          description={t('placeholder.description', { stage })}
        />
      </Panel>
    </div>
  )
}
