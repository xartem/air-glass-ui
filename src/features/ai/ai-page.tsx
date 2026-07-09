import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, MessageSquare, Plus, Sparkles, Trash2 } from 'lucide-react'

import { api, type AiConversationListItem } from '@/api'
import { AiChatView } from '@/components/ai-chat'
import { formatUsd } from '@/lib/ai-format'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { toast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useSiteDateTime } from '@/lib/datetime'
import { t } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'
import { cn } from '@/lib/utils'

/*
 * /ai (UI:ai §3): conversation list (title · date · tokens · cost · «⋯») on the
 * left, the selected dialog on the right — same chat component as the panel —
 * with the usage summary (tokens/cost + models that actually answered) in the
 * header. Only the user's own conversations (D:ai §5).
 */

export function AiPage() {
  const locale = useLocale()
  const siteTime = useSiteDateTime()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiConversationListItem | null>(null)

  const listQuery = useQuery({ queryKey: ['ai', 'conversations'], queryFn: api.ai.conversations })
  const conversations = listQuery.data ?? []
  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0] ?? null

  // Same query key as the chat's own detail query — one cache entry, no drift
  const detailQuery = useQuery({
    queryKey: ['ai', 'conversation', selected?.id ?? null],
    queryFn: () => api.ai.conversation(selected!.id),
    enabled: selected !== null,
  })

  const createMutation = useMutation({
    mutationFn: api.ai.createConversation,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
      setSelectedId(created.id)
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.ai.deleteConversation(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] })
      if (selected?.id === id) setSelectedId(null)
      toast.success(t('ai.chatDeleted'))
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  // Absolute chat timestamps render in the site timezone (C7 §4), not the browser's.
  const formatTime = (iso: string) => siteTime.format(iso)
  const formatTokens = (tokens: number) => new Intl.NumberFormat(locale).format(tokens)

  const usage = detailQuery.data?.usage
  const summary = usage
    ? [
        t('ai.summary', { tokens: formatTokens(usage.tokens), cost: formatUsd(usage.cost, locale) }),
        usage.models.length > 0 ? usage.models.join(', ') : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined

  return (
    <div className="flex min-h-full flex-col gap-4">
      <PageHeader
        title={t('ai.title')}
        icon={Sparkles}
        primaryAction={{
          label: t('ai.newChat'),
          icon: <Plus />,
          onClick: () => createMutation.mutate(),
          disabled: createMutation.isPending,
        }}
      />

      {listQuery.isPending ? (
        <div className="flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-64 w-full rounded-2xl lg:w-80" />
          <Skeleton className="h-64 min-w-0 flex-1 rounded-2xl" />
        </div>
      ) : listQuery.isError ? (
        <Panel>
          <EmptyState
            title={t('common.request_failed')}
            action={{ label: t('common.retry'), onClick: () => void listQuery.refetch() }}
          />
        </Panel>
      ) : conversations.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Sparkles}
            title={t('ai.noChats')}
            description={t('ai.hint')}
            action={{ label: t('ai.newChat'), onClick: () => createMutation.mutate() }}
          />
        </Panel>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          {/* Conversation list: title · date · tokens · cost · «⋯» (UI:ai §3) */}
          <Panel className="w-full shrink-0 self-start lg:w-80" contentClassName="p-2">
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 pe-10 text-start transition-colors',
                      conversation.id === selected?.id ? 'nav-item-active' : 'hover:bg-muted',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {conversation.title ?? t('ai.untitled')}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate ps-6 text-xs text-muted-foreground">
                      {formatTime(conversation.updated_at)} · {formatTokens(conversation.tokens)} tok ·{' '}
                      {formatUsd(conversation.cost, locale)}
                    </span>
                  </button>
                  <span className="absolute top-2 end-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label={t('common.actions')}>
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(conversation)}>
                          <Trash2 />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Selected dialog + usage summary in the header (UI:ai §3) */}
          <Panel
            icon={MessageSquare}
            title={selected?.title ?? t('ai.untitled')}
            description={summary}
            className="flex min-h-[60vh] min-w-0 flex-1 flex-col"
            contentClassName="flex min-h-0 flex-1 flex-col p-0"
          >
            {selected ? <AiChatView conversationId={selected.id} /> : null}
          </Panel>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('ai.deleteChat')}
        description={t('confirm.delete.description')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
