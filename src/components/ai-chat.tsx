import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  Cog,
  FileText,
  Flag,
  Paperclip,
  Send,
  Sparkles,
  Square,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import {
  api,
  type AiAttachment,
  type AiBlockButton,
  type AiConfirm,
  type AiMessage,
  type AiMessagePart,
  type AiPlan,
  type AiScreenContext,
  type AiStreamEvent,
  type AiToolCall,
} from '@/api'
import { AiBlockView } from '@/components/ai-blocks'
import { formatUsd } from '@/lib/ai-format'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { t } from '@/lib/i18n'
import { useCan, usePermissionChecker } from '@/lib/permissions'
import { useLocale } from '@/lib/use-locale'
import { cn } from '@/lib/utils'

/*
 * AiChatView (UI:ai §2, D:ai §4a/§4b/§5): one conversation — SSE-streamed
 * replies, tool rows, typed blocks, the plan gate and destructive confirms.
 * Shared by the slide-over panel and the /ai page. While a stream is active the
 * turn renders from local event state; `done` (or an abort/error) re-reads the
 * history from the server — the single source of truth.
 */

/** t() falls back to the key — treat that as "no translation registered". */
function optionalT(key: string): string | undefined {
  const translated = t(key)
  return translated === key ? undefined : translated
}

/** Up to 10 files per message (D:ai §4d). */
const MAX_ATTACHMENTS = 10

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * One attachment chip (D:ai §4d): image thumbnail or type icon + name + size.
 * A draft chip (before send) shows the × to remove; a sent chip links to the
 * file in the media library (the attachment lives there, not as a raw blob).
 */
function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: AiAttachment
  onRemove?: () => void
}) {
  const visual =
    attachment.is_image && attachment.preview_url ? (
      <img src={attachment.preview_url} alt="" className="size-5 shrink-0 rounded object-cover" />
    ) : (
      <FileText className="size-4 shrink-0 text-muted-foreground" />
    )
  const body = (
    <>
      {visual}
      <span className="min-w-0 truncate">{attachment.name}</span>
      <span className="shrink-0 text-muted-foreground">{formatSize(attachment.size)}</span>
    </>
  )
  return (
    <span className="flex max-w-full items-center gap-1.5 rounded-lg border bg-background/60 py-1 pr-1 pl-1.5 text-xs">
      {onRemove ? (
        <span className="flex min-w-0 items-center gap-1.5">{body}</span>
      ) : (
        // Sent chip → the file card in the media library (UI:ai §2).
        <Link to="/media" className="flex min-w-0 items-center gap-1.5 hover:underline">
          {body}
        </Link>
      )}
      {onRemove ? (
        <button
          type="button"
          aria-label={t('common.delete')}
          onClick={onRemove}
          className="ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  )
}

/** Empty-chat example prompts, filtered by the user's permissions (UI:ai §2). */
const EXAMPLES: { key: string; perm?: string }[] = [
  { key: 'ai.example.pages', perm: 'pages.manage' },
  { key: 'ai.example.products', perm: 'collections.products.view' },
  { key: 'ai.example.forms', perm: 'forms.submissions' },
  { key: 'ai.example.contacts', perm: 'contacts.manage' },
]

interface StreamState {
  status: 'streaming' | 'reconnecting'
  /** Optimistic echo of the just-sent user text; null for plan-approve streams. */
  userText: string | null
  /** Optimistic echo of the just-sent attachments (D:ai §4d). */
  userAttachments: AiAttachment[]
  parts: AiMessagePart[]
}

function applyEvent(state: StreamState, event: AiStreamEvent): StreamState {
  switch (event.type) {
    case 'delta': {
      const parts = [...state.parts]
      const last = parts[parts.length - 1]
      if (last?.kind === 'text') parts[parts.length - 1] = { kind: 'text', text: last.text + event.text }
      else parts.push({ kind: 'text', text: event.text })
      return { ...state, parts }
    }
    case 'tool_call':
      return { ...state, parts: [...state.parts, { kind: 'tool', call: { tool: event.tool, status: 'running', params: event.params } }] }
    case 'tool_result': {
      const parts = [...state.parts]
      for (let index = parts.length - 1; index >= 0; index--) {
        const part = parts[index]
        if (part?.kind === 'tool' && part.call.tool === event.tool && part.call.status === 'running') {
          parts[index] = { kind: 'tool', call: { ...part.call, status: event.status, result: event.result } }
          break
        }
      }
      return { ...state, parts }
    }
    case 'block':
      return { ...state, parts: [...state.parts, { kind: 'block', block: event.block }] }
    case 'plan_required':
      return { ...state, parts: [...state.parts, { kind: 'plan', plan: event.plan }] }
    case 'confirm_required':
      return { ...state, parts: [...state.parts, { kind: 'confirm', confirm: event.confirm }] }
    default:
      return state // 'created' is handled upstream; 'done' just precedes the refetch
  }
}

/* ---- sub-views ---- */

function ToolRow({ call }: { call: AiToolCall }) {
  return (
    <Collapsible className="max-w-[85%]">
      <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <Cog className={cn('size-3.5 shrink-0', call.status === 'running' && 'animate-spin')} />
        <span className="font-mono">{call.tool}</span>
        <span>— {t(`ai.tool.${call.status}`)}</span>
        <ChevronDown className="size-3 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 space-y-1.5 rounded-lg border bg-background/60 p-2 text-xs">
          <p className="font-medium text-muted-foreground">{t('ai.tool.params')}</p>
          <pre className="overflow-x-auto font-mono">{JSON.stringify(call.params, null, 2)}</pre>
          {call.result !== undefined ? (
            <>
              <p className="font-medium text-muted-foreground">{t('ai.tool.result')}</p>
              <pre className="overflow-x-auto font-mono">{JSON.stringify(call.result, null, 2)}</pre>
            </>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function PlanCard({
  plan,
  locale,
  busy,
  onApprove,
  onReject,
  onRefine,
}: {
  plan: AiPlan
  locale: string
  busy: boolean
  onApprove: (plan: AiPlan) => void
  onReject: (plan: AiPlan) => void
  onRefine: () => void
}) {
  return (
    <div className="max-w-[85%] space-y-2 rounded-xl border bg-background/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">{t('ai.plan.title')}</p>
      <p className="text-sm">{plan.description}</p>
      <Collapsible>
        <CollapsibleTrigger className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {t('ai.plan.steps', { count: plan.steps.length })}
          <ChevronDown className="size-3 transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="mt-1.5 space-y-1 text-xs">
            {plan.steps.map((step, index) => (
              <li key={index} className="flex items-center gap-1.5">
                <Cog className="size-3 shrink-0 text-muted-foreground" />
                <span className="font-mono">{step.tool}</span>
                <span className="text-muted-foreground">— {step.summary}</span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
      {plan.status === 'pending' ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" disabled={busy} onClick={() => onApprove(plan)}>
            {plan.estimated_cost != null
              ? t('ai.plan.execute_cost', { cost: formatUsd(plan.estimated_cost, locale) })
              : t('ai.plan.execute')}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={onRefine}>
            {t('ai.plan.refine')}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onReject(plan)}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <StatusBadge
            status={plan.status === 'approved' ? 'success' : 'archived'}
            label={t(`ai.plan.${plan.status}`)}
          />
          {plan.status === 'approved' && plan.actual_cost != null && plan.estimated_cost != null ? (
            <span className="text-xs text-muted-foreground">
              {t('ai.plan.cost', {
                estimate: formatUsd(plan.estimated_cost, locale),
                actual: formatUsd(plan.actual_cost, locale),
              })}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ConfirmCard({
  confirm,
  busy,
  onConfirm,
  onCancel,
}: {
  confirm: AiConfirm
  busy: boolean
  onConfirm: (confirm: AiConfirm) => void
  onCancel: (confirm: AiConfirm) => void
}) {
  return (
    <div className="max-w-[85%] space-y-2 rounded-xl border border-[var(--status-pending-fg)]/30 bg-[var(--status-pending-bg)] p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-pending-fg)]">
        <TriangleAlert className="size-4 shrink-0" />
        {optionalT(`ai.toolname.${confirm.tool}`) ?? confirm.tool}
      </p>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        {Object.entries(confirm.params).map(([key, value]) => (
          <div key={key} className="contents">
            <span className="font-mono text-muted-foreground">{key}</span>
            <span className="min-w-0 truncate">{value}</span>
          </div>
        ))}
      </div>
      {confirm.status === 'pending' ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="destructive-filled" disabled={busy} onClick={() => onConfirm(confirm)}>
            {t('common.confirm')}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCancel(confirm)}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : (
        <StatusBadge
          status={confirm.status === 'confirmed' ? 'success' : 'archived'}
          label={t(`ai.confirm.${confirm.status}`)}
        />
      )}
    </div>
  )
}

interface PartHandlers {
  locale: string
  busy: boolean
  onPlanApprove: (plan: AiPlan) => void
  onPlanReject: (plan: AiPlan) => void
  onRefine: () => void
  onConfirm: (confirm: AiConfirm) => void
  onCancel: (confirm: AiConfirm) => void
  onToolButton: (item: AiBlockButton) => void
}

function AssistantParts({ parts, handlers }: { parts: AiMessagePart[]; handlers: PartHandlers }) {
  return (
    <>
      {parts.map((part, index) => {
        switch (part.kind) {
          case 'text':
            return (
              <div key={index} className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
                {part.text}
              </div>
            )
          case 'tool':
            return <ToolRow key={index} call={part.call} />
          case 'block':
            return <AiBlockView key={index} block={part.block} onToolClick={handlers.onToolButton} />
          case 'plan':
            return (
              <PlanCard
                key={index}
                plan={part.plan}
                locale={handlers.locale}
                busy={handlers.busy}
                onApprove={handlers.onPlanApprove}
                onReject={handlers.onPlanReject}
                onRefine={handlers.onRefine}
              />
            )
          case 'confirm':
            return (
              <ConfirmCard
                key={index}
                confirm={part.confirm}
                busy={handlers.busy}
                onConfirm={handlers.onConfirm}
                onCancel={handlers.onCancel}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}

function MessageView({
  message,
  handlers,
  canManage,
}: {
  message: AiMessage
  handlers: PartHandlers
  canManage: boolean
}) {
  if (message.role === 'user') {
    const text = message.parts.map((part) => (part.kind === 'text' ? part.text : '')).join('')
    return (
      <div className="flex flex-col items-end gap-1.5">
        {text ? (
          <div className="max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
            {text}
          </div>
        ) : null}
        {message.attachments?.length ? (
          <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
            {message.attachments.map((attachment) => (
              <AttachmentChip key={attachment.media_id} attachment={attachment} />
            ))}
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <AssistantParts parts={message.parts} handlers={handlers} />
      {/* Soft daily-cap message: settings link only for ai.manage (UI:ai §2) */}
      {message.cost_limited && canManage ? (
        <Link to="/system/ai" className="inline-block text-xs text-primary hover:underline">
          {t('nav.aiSettings')}
        </Link>
      ) : null}
      {message.usage && message.usage.tokens > 0 ? (
        <p className="text-[11px] text-muted-foreground/70">
          {t('ai.usageLine', {
            model: message.usage.model,
            tokens: message.usage.tokens,
            cost: formatUsd(message.usage.cost, handlers.locale),
          })}
        </p>
      ) : null}
    </div>
  )
}

/* ---- main component ---- */

export function AiChatView({
  conversationId,
  onConversationCreated,
  screenContext = null,
  className,
}: {
  /** Null = a fresh chat; the first send opens a conversation server-side. */
  conversationId: number | null
  onConversationCreated?: (id: number) => void
  screenContext?: AiScreenContext | null
  className?: string
}) {
  const locale = useLocale()
  const queryClient = useQueryClient()
  const can = usePermissionChecker()
  const canManage = useCan('ai.manage')

  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState<AiAttachment[]>([])
  const [stream, setStream] = useState<StreamState | null>(null)
  // The × on the chip disables context until the end of the dialog (UI:ai §2)
  const [contextOn, setContextOn] = useState(true)
  const [pendingTool, setPendingTool] = useState<AiBlockButton | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  // Attaching goes through the media library and is gated by media.manage (D:ai §4d)
  const canAttach = useCan('media.manage')

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextMediaId = useRef(9000)

  function addFiles(list: FileList | null) {
    if (!list || !canAttach) return
    const room = MAX_ATTACHMENTS - attachments.length
    const files = [...list]
    if (files.length > room) toast.error(t('ai.attachLimit'))
    // Real backend: each file → MediaService.upload → media_id (D:ai §4d); the
    // mock synthesizes that upload result locally (object URL preview for images).
    const accepted: AiAttachment[] = files.slice(0, Math.max(0, room)).map((file) => ({
      media_id: nextMediaId.current++,
      name: file.name,
      size: file.size,
      is_image: file.type.startsWith('image/'),
      preview_url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    if (accepted.length) setAttachments((prev) => [...prev, ...accepted])
  }

  useEffect(() => setContextOn(true), [conversationId])
  // Abort a running stream when the chat unmounts (panel closed mid-answer)
  useEffect(() => () => abortRef.current?.abort(), [])

  const detailQuery = useQuery({
    queryKey: ['ai', 'conversation', conversationId],
    queryFn: () => api.ai.conversation(conversationId!),
    enabled: conversationId !== null,
  })
  const messages = detailQuery.data?.messages ?? []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, stream?.parts.length, stream?.userText])

  async function runStream(
    userText: string | null,
    userAttachments: AiAttachment[],
    invoke: (handlers: { onEvent: (event: AiStreamEvent) => void; signal: AbortSignal }) => Promise<void>,
  ) {
    const controller = new AbortController()
    abortRef.current = controller
    setStream({ status: 'streaming', userText, userAttachments, parts: [] })
    try {
      await invoke({
        onEvent: (event) => {
          if (event.type === 'created') {
            onConversationCreated?.(event.conversation_id)
            return
          }
          setStream((current) => (current ? applyEvent(current, event) : current))
        },
        signal: controller.signal,
      })
    } catch (cause) {
      // Dropped stream → "reconnecting…", then the history refetch below
      // restores the turn from the server (UI:ai §2)
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setStream((current) => (current ? { ...current, status: 'reconnecting' } : current))
        await new Promise((resolve) => setTimeout(resolve, 600))
      }
    } finally {
      abortRef.current = null
      // invalidateQueries resolves after the active refetch — no content flash
      await queryClient.invalidateQueries({ queryKey: ['ai'] })
      setStream(null)
    }
  }

  function send() {
    const text = draft.trim()
    if ((!text && attachments.length === 0) || stream) return
    const sent = attachments
    setDraft('')
    setAttachments([])
    void runStream(text || null, sent, (handlers) =>
      api.ai.sendMessage(conversationId, text, contextOn ? screenContext : null, handlers, sent),
    )
  }

  function stop() {
    abortRef.current?.abort()
  }

  async function mutate(action: () => Promise<unknown>) {
    setActionBusy(true)
    try {
      await action()
      await queryClient.invalidateQueries({ queryKey: ['ai'] })
    } finally {
      setActionBusy(false)
    }
  }

  const handlers: PartHandlers = {
    locale,
    busy: actionBusy || stream !== null,
    onPlanApprove: (plan) => void runStream(null, [], (h) => api.ai.approvePlan(plan.id, h)),
    onPlanReject: (plan) => void mutate(() => api.ai.rejectPlan(plan.id)),
    onRefine: () => inputRef.current?.focus(),
    onConfirm: (confirm) => void mutate(() => api.ai.confirmAction(confirm.id)),
    onCancel: (confirm) => void mutate(() => api.ai.cancelAction(confirm.id)),
    onToolButton: (item) => {
      if (!item.tool || conversationId === null) return
      if (item.style === 'danger') setPendingTool(item)
      else void mutate(() => api.ai.runTool(conversationId, item.tool!, item.args ?? {}))
    },
  }

  const examples = EXAMPLES.filter((example) => can(example.perm))
  const empty = messages.length === 0 && !stream

  return (
    <div data-slot="ai-chat" className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversationId !== null && detailQuery.isPending ? (
          <div className="space-y-3">
            <Skeleton className="ml-auto h-9 w-2/3 rounded-xl" />
            <Skeleton className="h-16 w-3/4 rounded-xl" />
          </div>
        ) : conversationId !== null && detailQuery.isError ? (
          <EmptyState
            title={t('common.request_failed')}
            action={{ label: t('common.retry'), onClick: () => void detailQuery.refetch() }}
          />
        ) : empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="size-5" />
            </span>
            <p className="max-w-72 text-sm text-muted-foreground">{t('ai.hint')}</p>
            <div className="flex w-full max-w-sm flex-col gap-1.5">
              {examples.map((example) => (
                <button
                  key={example.key}
                  type="button"
                  className="rounded-lg border bg-background/60 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    setDraft(t(example.key))
                    inputRef.current?.focus()
                  }}
                >
                  {t(example.key)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageView key={message.id} message={message} handlers={handlers} canManage={canManage} />
            ))}
            {stream ? (
              <>
                {stream.userText !== null || stream.userAttachments.length > 0 ? (
                  <div className="flex flex-col items-end gap-1.5">
                    {stream.userText !== null ? (
                      <div className="max-w-[85%] rounded-xl bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
                        {stream.userText}
                      </div>
                    ) : null}
                    {stream.userAttachments.length > 0 ? (
                      <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
                        {stream.userAttachments.map((attachment) => (
                          <AttachmentChip key={attachment.media_id} attachment={attachment} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <AssistantParts parts={stream.parts} handlers={handlers} />
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Spinner className="size-3.5" />
                    {stream.status === 'reconnecting' ? t('ai.reconnecting') : null}
                  </p>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <div
        className="space-y-2 border-t p-3"
        // Drag-drop attachments onto the input area (UI:ai §2); no-op without media.manage.
        onDragOver={canAttach ? (event) => event.preventDefault() : undefined}
        onDrop={
          canAttach
            ? (event) => {
                event.preventDefault()
                addFiles(event.dataTransfer.files)
              }
            : undefined
        }
      >
        {attachments.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.media_id}
                attachment={attachment}
                onRemove={() =>
                  setAttachments((prev) => prev.filter((item) => item.media_id !== attachment.media_id))
                }
              />
            ))}
            <span className="text-xs text-muted-foreground">
              {attachments.length}/{MAX_ATTACHMENTS}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          {canAttach ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                aria-label={t('ai.attach')}
                disabled={attachments.length >= MAX_ATTACHMENTS}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip />
              </Button>
            </>
          ) : null}
          <Input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('ai.placeholder')}
            // Ctrl/⌘+V of files attaches them (UI:ai §2)
            onPaste={
              canAttach
                ? (event) => {
                    if (event.clipboardData.files.length > 0) {
                      event.preventDefault()
                      addFiles(event.clipboardData.files)
                    }
                  }
                : undefined
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                send()
              }
            }}
          />
          {stream ? (
            <Button size="icon" variant="outline" onClick={stop} aria-label={t('ai.stop')}>
              <Square />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={send}
              disabled={!draft.trim() && attachments.length === 0}
              aria-label={t('ai.send')}
            >
              <Send />
            </Button>
          )}
        </div>
        {screenContext && contextOn ? (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Flag className="size-3 shrink-0" />
            <span className="min-w-0 truncate">{t('ai.context.screen', { name: screenContext.label })}</span>
            <button
              type="button"
              aria-label={t('ai.context.disable')}
              onClick={() => setContextOn(false)}
              className="flex size-4 shrink-0 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </span>
        ) : null}
      </div>

      {/* Destructive suggested-tool button → standard confirm flow (D:ai §4a) */}
      <ConfirmDialog
        open={pendingTool !== null}
        onOpenChange={(open) => !open && setPendingTool(null)}
        title={t('ai.confirm.title')}
        description={t('ai.toolConfirm.description', { tool: pendingTool?.tool ?? '' })}
        confirmLabel={t('common.confirm')}
        destructive
        onConfirm={() => {
          const item = pendingTool
          setPendingTool(null)
          if (item?.tool && conversationId !== null) {
            void mutate(() => api.ai.runTool(conversationId, item.tool!, item.args ?? {}))
          }
        }}
      />
    </div>
  )
}
