import { createMemo, createSignal, lazy, Show, Suspense } from "solid-js"
import { useParams, useSearchParams } from "@solidjs/router"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { getFilename } from "@opencode-ai/util/path"
import { UnifiedWorkspace } from "@/components/unified-workspace"
import { DocumentPanel } from "@/components/document-panel"
import { ConversationPanel } from "@/components/conversation-panel"
import { ContextPanel } from "@/components/context-panel"
import { createWorkspaceState } from "@/pages/workspace/state"
import { CommentsProvider } from "@/context/comments"
import { PromptProvider } from "@/context/prompt"
import { TerminalProvider } from "@/context/terminal"
import { FileProvider } from "@/context/file"
import { TokenCounter } from "@/components/token-counter"
import { ModeSwitcher, type WorkMode } from "@/components/mode-switcher"

export default function UnifiedWorkspacePage() {
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const layout = useLayout()
  const dir = createMemo(() => decode64(params.dir) ?? "")

  const project = createMemo(() =>
    layout.projects.list().find((item) => item.worktree === dir() || item.sandboxes?.includes(dir())),
  )

  const name = createMemo(() => (project()?.name ?? getFilename(dir())) || "Ideaspace project")

  const workspace = createWorkspaceState()
  const selectedPlan = createMemo(() => workspace.selected())
  const sessionId = createMemo(() => {
    const id = searchParams.id
    return Array.isArray(id) ? id[0] : id
  })

  const [mode, setMode] = createSignal<WorkMode>("plan")

  const clearTask = () => {
    const newParams = { ...searchParams }
    delete newParams.task
    delete newParams.mode
    setSearchParams(newParams, { replace: true })
  }

  return (
    <TerminalProvider>
      <PromptProvider>
        <CommentsProvider>
          <div class="flex flex-col h-full bg-background-base">
            <div class="border-b border-border-weak-base px-4 pt-5 pb-4">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div class="flex flex-col gap-1">
                  <div class="text-12-medium uppercase tracking-[0.16em] text-text-weak">Ideaspace project</div>
                  <h1 class="text-28-medium text-text-strong">{name()}</h1>
                  <p class="text-13-regular text-text-weak">
                    Unified workspace for planning, tasks, and AI collaboration.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <ModeSwitcher mode={mode()} onModeChange={setMode} />
                  <TokenCounter sessionId={sessionId()} />
                </div>
              </div>
            </div>

            <div class="flex-1 overflow-hidden">
              <FileProvider>
                <UnifiedWorkspace
                  document={<DocumentPanel planPath={selectedPlan() || undefined} />}
                  conversation={<ConversationPanel sessionId={sessionId()} onClearTask={clearTask} />}
                  context={<ContextPanel attachedFiles={[]} />}
                  mode={mode()}
                />
              </FileProvider>
            </div>
          </div>
        </CommentsProvider>
      </PromptProvider>
    </TerminalProvider>
  )
}
