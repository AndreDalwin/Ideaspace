import { type JSX, Show, createSignal, createMemo } from "solid-js"
import { createMediaQuery } from "@solid-primitives/media"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"
import { IconButton } from "@opencode-ai/ui/icon-button"
import type { WorkMode } from "@/components/mode-switcher"

interface UnifiedWorkspaceProps {
  document: JSX.Element
  conversation: JSX.Element
  context: JSX.Element
  mode?: WorkMode
}

const MIN_DOC_WIDTH = 240
const MAX_DOC_WIDTH = 600
const MIN_CONTEXT_WIDTH = 200
const MAX_CONTEXT_WIDTH = 480
const DEFAULT_DOC_WIDTH = 320
const DEFAULT_CONTEXT_WIDTH = 240
const COLLAPSE_THRESHOLD = 160

export function UnifiedWorkspace(props: UnifiedWorkspaceProps) {
  const isDesktop = createMediaQuery("(min-width: 1024px)")

  const [docWidth, setDocWidth] = createSignal(DEFAULT_DOC_WIDTH)
  const [contextWidth, setContextWidth] = createSignal(DEFAULT_CONTEXT_WIDTH)
  const [showDocument, setShowDocument] = createSignal(true)
  const [showContext, setShowContext] = createSignal(true)

  const convWidth = createMemo(() => {
    const doc = showDocument() ? docWidth() : 0
    const ctx = showContext() && isDesktop() ? contextWidth() : 0
    return `calc(100% - ${doc}px - ${ctx}px)`
  })

  const Panel = {
    document: "document" as const,
    conversation: "conversation" as const,
    context: "context" as const,
  }

  type PanelName = (typeof Panel)[keyof typeof Panel]

  const panelMode: Record<WorkMode, PanelName> = {
    plan: Panel.document,
    build: Panel.conversation,
    review: Panel.context,
  }

  const isActivePanel = (panel: PanelName) => {
    if (!props.mode) return true
    return panelMode[props.mode] === panel
  }

  const contentClass = (active: boolean) =>
    `flex-1 transition-opacity duration-200 ease-out motion-safe:transition-all ${
      active ? "opacity-100" : "opacity-60"
    }`

  return (
    <div class="flex h-full w-full overflow-hidden bg-background-base">
      <Show when={showDocument()}>
        <div
          class="flex flex-col border-r border-border-weak-base overflow-hidden shrink-0 motion-safe:transition-all duration-300 ease-out"
          style={{ width: `${docWidth()}px` }}
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-border-weak-base bg-background-base">
            <span class="text-13-medium text-text-strong">Document</span>
            <IconButton
              icon="layout-left"
              variant="ghost"
              size="small"
              onClick={() => setShowDocument(false)}
              aria-label="Hide document panel"
              class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
            />
          </div>
          <div class={contentClass(isActivePanel(Panel.document)) + " overflow-auto"}>{props.document}</div>
        </div>

        <ResizeHandle
          direction="horizontal"
          edge="end"
          size={docWidth()}
          min={MIN_DOC_WIDTH}
          max={MAX_DOC_WIDTH}
          collapseThreshold={COLLAPSE_THRESHOLD}
          onResize={setDocWidth}
          onCollapse={() => setShowDocument(false)}
        />
      </Show>

      <div
        class="flex flex-col overflow-hidden min-w-0 motion-safe:transition-all duration-300 ease-out"
        style={{ width: convWidth() }}
      >
        <div class="flex items-center justify-between px-3 py-2 border-b border-border-weak-base bg-background-base shrink-0">
          <span class="text-13-medium text-text-strong">AI Assistant</span>
          <div class="flex items-center gap-1">
            <Show when={!showDocument()}>
              <IconButton
                icon="layout-left"
                variant="ghost"
                size="small"
                onClick={() => setShowDocument(true)}
                aria-label="Show document panel"
                class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
              />
            </Show>
            <Show when={!showContext() && isDesktop()}>
              <IconButton
                icon="layout-right"
                variant="ghost"
                size="small"
                onClick={() => setShowContext(true)}
                aria-label="Show context panel"
                class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
              />
            </Show>
          </div>
        </div>
        <div class={contentClass(isActivePanel(Panel.conversation)) + " overflow-hidden"}>{props.conversation}</div>
      </div>

      <Show when={showContext() && isDesktop()}>
        <ResizeHandle
          direction="horizontal"
          edge="start"
          size={contextWidth()}
          min={MIN_CONTEXT_WIDTH}
          max={MAX_CONTEXT_WIDTH}
          collapseThreshold={COLLAPSE_THRESHOLD}
          onResize={setContextWidth}
          onCollapse={() => setShowContext(false)}
        />

        <div
          class="flex flex-col border-l border-border-weak-base overflow-hidden shrink-0 motion-safe:transition-all duration-300 ease-out"
          style={{ width: `${contextWidth()}px` }}
        >
          <div class="flex items-center justify-between px-3 py-2 border-b border-border-weak-base bg-background-base">
            <span class="text-13-medium text-text-strong">Context</span>
            <IconButton
              icon="layout-right"
              variant="ghost"
              size="small"
              onClick={() => setShowContext(false)}
              aria-label="Hide context panel"
              class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
            />
          </div>
          <div class={contentClass(isActivePanel(Panel.context)) + " overflow-auto"}>{props.context}</div>
        </div>
      </Show>
    </div>
  )
}
