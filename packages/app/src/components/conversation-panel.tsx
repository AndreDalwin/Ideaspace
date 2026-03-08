import { Show, createSignal, createEffect, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { useParams, useSearchParams } from "@solidjs/router"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { usePrompt } from "@/context/prompt"
import { useLanguage } from "@/context/language"
import type { Task } from "@/pages/tasks/state"
import { MessageTimeline } from "@/pages/session/message-timeline"
import { createSessionComposerState, SessionComposerRegion, type SessionComposerState } from "@/pages/session/composer"
import { createAutoScroll } from "@opencode-ai/ui/hooks"
import type { UserMessage } from "@opencode-ai/sdk/v2"
import { same } from "@/utils/same"

interface ConversationPanelProps {
  sessionId?: string
  activeTask?: Task | null
  onClearTask?: () => void
}

function TaskBadge(props: { task: Task; onClear: () => void }) {
  return (
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/30 text-13-medium text-text-strong transition-colors duration-200 hover:bg-accent-primary/20">
      <span class="truncate max-w-[200px]" title={props.task.title}>
        {props.task.title}
      </span>
      <button
        onClick={props.onClear}
        class="text-text-weak motion-safe:transition-colors duration-200 hover:text-text-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary/70"
        aria-label="Clear active task"
      >
        ×
      </button>
    </div>
  )
}

const emptyUserMessages: UserMessage[] = []

export function ConversationPanel(props: ConversationPanelProps) {
  const params = useParams()
  const sdk = useSDK()
  const sync = useSync()
  const prompt = usePrompt()
  const language = useLanguage()
  const [searchParams] = useSearchParams()

  const [ui, setUi] = createStore({
    scroll: {
      overflow: false,
      bottom: true,
    },
    scrollGesture: 0,
    deferRender: false,
  })

  let scroller: HTMLDivElement | undefined
  let content: HTMLDivElement | undefined
  let inputRef!: HTMLDivElement
  let promptDock: HTMLDivElement | undefined

  const [urlTask, setUrlTask] = createSignal<Task | null>(null)

  createEffect(async () => {
    const taskId = searchParams.task
    if (!taskId || props.activeTask) {
      setUrlTask(null)
      return
    }

    try {
      const client = sdk.client as unknown as {
        get: <T>(opts: { url: string }) => Promise<{ data?: T }>
      }
      const res = await client.get<{ tasks: Task[] }>({
        url: "/task-board",
      })
      if (res.data) {
        const task = res.data.tasks.find((t) => t.id === taskId)
        if (task) setUrlTask(task)
      }
    } catch (err) {
      console.error("Failed to load task:", err)
    }
  })

  const activeTask = () => props.activeTask || urlTask()
  const sessionId = () => props.sessionId || params.id

  const messages = createMemo(() => (sessionId() ? (sync.data.message[sessionId()!] ?? []) : []))
  const messagesReady = createMemo(() => {
    const id = sessionId()
    if (!id) return true
    return sync.data.message[id] !== undefined
  })

  const userMessages = createMemo(
    () => messages().filter((m) => m.role === "user") as UserMessage[],
    emptyUserMessages,
    { equals: same },
  )

  const historyMore = createMemo(() => {
    const id = sessionId()
    if (!id) return false
    return sync.session.history.more(id)
  })
  const historyLoading = createMemo(() => {
    const id = sessionId()
    if (!id) return false
    return sync.session.history.loading(id)
  })

  const composer = createSessionComposerState()

  const autoScroll = createAutoScroll({
    working: () => true,
    overflowAnchor: "dynamic",
  })

  const scrollGestureWindowMs = 250

  const markScrollGesture = (target?: EventTarget | null) => {
    const root = scroller
    if (!root) return

    const el = target instanceof Element ? target : undefined
    const nested = el?.closest("[data-scrollable]")
    if (nested && nested !== root) return

    setUi("scrollGesture", Date.now())
  }

  const hasScrollGesture = () => Date.now() - ui.scrollGesture < scrollGestureWindowMs

  const updateScrollState = (el: HTMLDivElement) => {
    const max = el.scrollHeight - el.clientHeight
    const overflow = max > 1
    const bottom = !overflow || el.scrollTop >= max - 2

    if (ui.scroll.overflow === overflow && ui.scroll.bottom === bottom) return
    setUi("scroll", { overflow, bottom })
  }

  let scrollStateFrame: number | undefined
  let scrollStateTarget: HTMLDivElement | undefined

  const scheduleScrollState = (el: HTMLDivElement) => {
    scrollStateTarget = el
    if (scrollStateFrame !== undefined) return

    scrollStateFrame = requestAnimationFrame(() => {
      scrollStateFrame = undefined

      const target = scrollStateTarget
      scrollStateTarget = undefined
      if (!target) return

      updateScrollState(target)
    })
  }

  const setScrollRef = (el: HTMLDivElement | undefined) => {
    scroller = el
    autoScroll.scrollRef(el)
    if (el) scheduleScrollState(el)
  }

  const resumeScroll = () => {
    autoScroll.forceScrollToBottom()
    const el = scroller
    if (el) scheduleScrollState(el)
  }

  const anchor = (id: string) => `message-${id}`

  return (
    <div class="flex flex-col h-full bg-background-stronger">
      <div class="flex items-center justify-between px-4 py-2 border-b border-border-weak-base bg-background-stronger shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-11-regular text-text-weak">Context:</span>
          <span class="text-11-medium text-text-strong">Current document</span>
          <Show when={activeTask()}>
            <span class="text-11-regular text-text-weak">+</span>
            <span class="text-11-medium text-accent-primary">1 task</span>
          </Show>
        </div>

        <Show when={activeTask()}>
          <TaskBadge task={activeTask()!} onClear={props.onClearTask || (() => {})} />
        </Show>
      </div>

      <div class="flex-1 min-h-0 overflow-hidden">
        <Show
          when={sessionId()}
          fallback={
            <ScrollView class="h-full scroll-smooth">
              <div class="flex flex-col items-center justify-center h-full text-center py-20 px-4">
                <div class="text-24-semibold text-text-strong mb-2">What would you like to work on?</div>
                <div class="text-14-regular text-text-weak max-w-md">
                  I can help you plan, implement, and review your work. Start by describing what you want to build.
                </div>
              </div>
            </ScrollView>
          }
        >
          <div
            class={`flex-1 min-h-0 overflow-hidden transition-opacity duration-200 ease-out motion-safe:transition-all ${
              messagesReady() ? "opacity-100" : "opacity-0"
            }`}
          >
            <MessageTimeline
              mobileChanges={false}
              mobileFallback={null}
              scroll={ui.scroll}
              onResumeScroll={resumeScroll}
              setScrollRef={setScrollRef}
              onScheduleScrollState={scheduleScrollState}
              onAutoScrollHandleScroll={autoScroll.handleScroll}
              onMarkScrollGesture={markScrollGesture}
              hasScrollGesture={hasScrollGesture}
              isDesktop={true}
              onScrollSpyScroll={() => {}}
              onTurnBackfillScroll={() => {}}
              onAutoScrollInteraction={autoScroll.handleInteraction}
              centered={true}
              setContentRef={(el) => {
                content = el
                autoScroll.contentRef(el)
                const root = scroller
                if (root) scheduleScrollState(root)
              }}
              turnStart={0}
              historyMore={historyMore()}
              historyLoading={historyLoading()}
              onLoadEarlier={() => {}}
              renderedUserMessages={userMessages()}
              anchor={anchor}
              onRegisterMessage={() => {}}
              onUnregisterMessage={() => {}}
            />
          </div>
        </Show>
      </div>

      <SessionComposerRegion
        state={composer}
        ready={!ui.deferRender && messagesReady()}
        centered={true}
        inputRef={(el) => {
          inputRef = el
        }}
        newSessionWorktree="main"
        onNewSessionWorktreeReset={() => {}}
        onSubmit={() => {
          resumeScroll()
        }}
        onResponseSubmit={resumeScroll}
        setPromptDockRef={(el) => {
          promptDock = el
        }}
        activeTask={activeTask()}
        onClearTask={props.onClearTask}
      />
    </div>
  )
}
