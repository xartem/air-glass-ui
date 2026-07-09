import type { ComponentType, ReactNode } from 'react'
import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * SettingsLayout (E6 §1C): vertical section nav on the left, form on the right,
 * sticky "Save" at the bottom. The single archetype for ALL settings screens.
 */

export type SettingsSection = {
  key: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

export function SettingsLayout({
  sections,
  active,
  onSectionChange,
  children,
  onSave,
  dirty = false,
  className,
}: {
  sections: SettingsSection[]
  active: string
  onSectionChange: (key: string) => void
  children: ReactNode
  onSave: { onClick: () => void; disabled?: boolean }
  dirty?: boolean
  className?: string
}) {
  return (
    <div data-slot="settings-layout" className={cn('flex min-h-full flex-col gap-4', className)}>
      {/* Section nav: vertical column ≥lg, horizontal scrollable strip below (E1 §4) */}
      <div className="flex flex-1 flex-col items-stretch gap-4 lg:flex-row lg:items-start lg:gap-6">
        <nav
          aria-label={t('settings.nav_label')}
          className="flex w-full shrink-0 gap-1 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:space-y-1 lg:gap-0 lg:overflow-visible lg:pb-0"
        >
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = section.key === active
            return (
              <button
                key={section.key}
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSectionChange(section.key)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-start text-sm whitespace-nowrap transition-colors lg:w-full',
                  isActive ? 'nav-item-active font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {Icon ? <Icon className="size-4" /> : null}
                {section.label}
              </button>
            )
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <div className="glass-header sticky bottom-0 -mx-1 mt-auto flex items-center justify-end gap-3 rounded-lg border-t-0 px-3 py-2.5">
        {dirty ? <span className="text-xs text-muted-foreground">{t('editor.unsaved')}</span> : null}
        <Button onClick={onSave.onClick} disabled={onSave.disabled}>
          <Save />
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
