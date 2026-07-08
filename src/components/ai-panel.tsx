import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, Plus, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { api, type AiScreenContext } from '@/api'
import { buildNavGroups, flattenNavItems } from '@/app/nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AiChatView } from '@/components/ai-chat'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { useCan } from '@/lib/permissions'
import { useLocale } from '@/lib/use-locale'

/*
 * AiPanel (UI:ai §1–2, E5): the assistant slide-over, reachable from ANY screen
 * (topbar button + ⌘J). Hidden without ai.use OR when no LLM key is configured
 * (me.ai_available). Holds the last conversation; «+» starts a fresh chat,
 * history leads to /ai. The current screen feeds the context chip.
 */

const ACTIVE_KEY = 'admin.ai_panel_conversation'

function readStoredActive(): number | null {
  const raw = localStorage.getItem(ACTIVE_KEY)
  const id = raw === null ? NaN : Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** Screen context from the route (v1): the deepest matching nav entry names the screen. */
function deriveContext(pathname: string): AiScreenContext | null {
  let best: { to: string; label: string } | null = null
  for (const item of flattenNavItems(buildNavGroups())) {
    const match = item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`)
    if (match && (!best || item.to.length > best.to.length)) best = item
  }
  return best ? { route: pathname, label: best.label } : null
}

export function AiPanel() {
  const { me } = useAuth()
  const canUse = useCan('ai.use')
  // Module inactive without an LLM key — the button disappears (UI:ai §1)
  if (!canUse || !me.ai_available) return null
  return <AiPanelInner />
}

function AiPanelInner() {
  useLocale()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(readStoredActive)

  // Hotkey ⌘J / Ctrl+J toggles the panel (UI:ai §2); active only when the button is
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const listQuery = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: api.ai.conversations,
    enabled: open,
  })

  function setActive(id: number | null) {
    setActiveId(id)
    if (id === null) localStorage.removeItem(ACTIVE_KEY)
    else localStorage.setItem(ACTIVE_KEY, String(id))
  }

  // The panel keeps the LAST dialog: fall back to the newest one when the
  // stored id is gone (deleted on /ai) or nothing is stored yet.
  useEffect(() => {
    if (!open || !listQuery.data) return
    if (activeId !== null && listQuery.data.some((conversation) => conversation.id === activeId)) return
    setActive(listQuery.data[0]?.id ?? null)
  }, [open, listQuery.data, activeId])

  const active = listQuery.data?.find((conversation) => conversation.id === activeId)
  const title = activeId === null ? t('ai.title') : (active?.title ?? t('ai.untitled'))
  const screenContext = deriveContext(pathname)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('shell.ai')}>
          <Sparkles />
        </Button>
      </SheetTrigger>
      {/* Full width on phones; capped panel from sm up (UI:ai §2 ~420px) */}
      <SheetContent
        side="right"
        className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 pr-8">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 truncate">{title}</span>
            <span className="ml-auto flex shrink-0 items-center gap-0.5">
              <Button variant="ghost" size="icon-sm" aria-label={t('ai.newChat')} onClick={() => setActive(null)}>
                <Plus />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={t('ai.allChats')} asChild>
                <Link to="/ai" onClick={() => setOpen(false)}>
                  <History />
                </Link>
              </Button>
            </span>
          </SheetTitle>
          <SheetDescription>{t('ai.disclaimer')}</SheetDescription>
        </SheetHeader>

        <AiChatView
          conversationId={activeId}
          onConversationCreated={setActive}
          screenContext={screenContext}
        />
      </SheetContent>
    </Sheet>
  )
}
