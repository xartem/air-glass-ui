import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Ellipsis, FileWarning } from 'lucide-react'

import { api, type AiFinding, type AiFindingSeverity, type AiFindingStatus } from '@/api'
import { EmptyState } from '@/components/empty-state'
import { Panel } from '@/components/panel'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { toast } from '@/components/toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useSiteDateTime } from '@/lib/datetime'
import { t } from '@/lib/i18n'

/*
 * «Находки в логах» (UI:ai §4, D:ai §4c): grouped error/critical findings of the
 * nightly log triage. Row: severity badge · title/AI summary (expandable sample
 * + context) · count · first/last seen · status · «⋯» with the new→acknowledged
 * →resolved flow (resolve prompts for a note: commit/version of the fix).
 */

const SEVERITY_BADGE: Record<AiFindingSeverity, StatusKind> = { critical: 'error', error: 'pending' }
const STATUS_BADGE: Record<AiFindingStatus, StatusKind> = { new: 'info', acknowledged: 'pending', resolved: 'success' }

const SEVERITIES: AiFindingSeverity[] = ['critical', 'error']
const STATUSES: AiFindingStatus[] = ['new', 'acknowledged', 'resolved']

function FindingRow({
  finding,
  formatTime,
  onAcknowledge,
  onResolve,
}: {
  finding: AiFinding
  formatTime: (iso: string) => string
  onAcknowledge: (finding: AiFinding) => void
  onResolve: (finding: AiFinding) => void
}) {
  return (
    <li>
      <Collapsible>
        <div className="flex items-center gap-3 py-3">
          <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-3 text-left">
            <StatusBadge
              status={SEVERITY_BADGE[finding.severity]}
              label={t(`ai.findings.severity.${finding.severity}`)}
              className="shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{finding.title}</span>
              {finding.summary ? (
                <span className="block truncate text-xs text-muted-foreground">{finding.summary}</span>
              ) : null}
            </span>
            <Badge variant="secondary" className="shrink-0">
              {t('ai.findings.count', { count: finding.count })}
            </Badge>
            <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground max-md:hidden">
              {formatTime(finding.last_seen)}
            </span>
            <StatusBadge
              status={STATUS_BADGE[finding.status]}
              label={t(`ai.findings.status.${finding.status}`)}
              className="shrink-0"
            />
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          {finding.status !== 'resolved' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.actions')}>
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {finding.status === 'new' ? (
                  <DropdownMenuItem onClick={() => onAcknowledge(finding)}>
                    {t('ai.findings.acknowledge')}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onResolve(finding)}>{t('ai.findings.resolve')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        <CollapsibleContent>
          <div className="space-y-2 pb-3 text-xs">
            <p className="text-muted-foreground">
              {t('ai.findings.first_seen')}: {formatTime(finding.first_seen)} · {t('ai.findings.last_seen')}:{' '}
              {formatTime(finding.last_seen)}
            </p>
            <p className="font-medium">{t('ai.findings.sample')}</p>
            <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-2 font-mono">{finding.sample}</pre>
            <p className="font-medium">{t('ai.findings.context')}</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              {Object.entries(finding.context).map(([key, value]) => (
                <div key={key} className="contents">
                  <span className="font-mono text-muted-foreground">{key}</span>
                  <span className="min-w-0 truncate font-mono">{value}</span>
                </div>
              ))}
            </div>
            {finding.resolved_note ? (
              <p className="text-muted-foreground">{t('ai.findings.resolved_note', { note: finding.resolved_note })}</p>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

export function AiFindingsPanel() {
  const siteTime = useSiteDateTime()
  const queryClient = useQueryClient()
  const [severity, setSeverity] = useState<'all' | AiFindingSeverity>('all')
  const [status, setStatus] = useState<'all' | AiFindingStatus>('all')
  const [resolveTarget, setResolveTarget] = useState<AiFinding | null>(null)
  const [note, setNote] = useState('')

  const findingsQuery = useQuery({ queryKey: ['ai', 'findings'], queryFn: api.ai.findings })

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: AiFindingStatus; note?: string }) =>
      api.ai.setFindingStatus(input.id, input.status, input.note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ai', 'findings'] })
      toast.success(t('ai.findings.updated'))
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  // The real API filters server-side (D:ai §6a); the mock returns all rows
  const rows = useMemo(
    () =>
      (findingsQuery.data ?? []).filter(
        (finding) =>
          (severity === 'all' || finding.severity === severity) &&
          (status === 'all' || finding.status === status),
      ),
    [findingsQuery.data, severity, status],
  )

  // Absolute times render in the site timezone (C7 §4), not the operator's browser.
  const formatTime = (iso: string) => siteTime.format(iso)

  function submitResolve() {
    if (resolveTarget) statusMutation.mutate({ id: resolveTarget.id, status: 'resolved', note })
    setResolveTarget(null)
    setNote('')
  }

  return (
    <Panel
      icon={FileWarning}
      title={t('ai.findings.title')}
      description={t('ai.findings.hint')}
      actions={
        <>
          <Select value={severity} onValueChange={(value) => setSeverity(value as typeof severity)}>
            <SelectTrigger size="sm" aria-label={t('ai.findings.filter.severity')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('ai.findings.filter.all')}</SelectItem>
              {SEVERITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`ai.findings.severity.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger size="sm" aria-label={t('ai.findings.filter.status')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('ai.findings.filter.all')}</SelectItem>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`ai.findings.status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      }
    >
      {findingsQuery.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : findingsQuery.isError ? (
        <EmptyState
          title={t('common.request_failed')}
          action={{ label: t('common.retry'), onClick: () => void findingsQuery.refetch() }}
        />
      ) : rows.length === 0 ? (
        <EmptyState icon={FileWarning} title={t('ai.findings.empty')} />
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {rows.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              formatTime={formatTime}
              onAcknowledge={(target) => statusMutation.mutate({ id: target.id, status: 'acknowledged' })}
              onResolve={(target) => {
                setNote('')
                setResolveTarget(target)
              }}
            />
          ))}
        </ul>
      )}

      {/* Resolve prompts for a note: commit/version of the fix (D:ai §4c) */}
      <Dialog open={resolveTarget !== null} onOpenChange={(open) => !open && setResolveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ai.findings.note_title')}</DialogTitle>
            <DialogDescription>{t('ai.findings.note_hint')}</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('ai.findings.note_placeholder')}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolveTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitResolve}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
