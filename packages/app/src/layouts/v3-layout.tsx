import { ParentProps, createMemo } from "solid-js"
import { useParams } from "@solidjs/router"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { getFilename } from "@opencode-ai/util/path"
import { V3Sidebar } from "@/components/v3-sidebar"
import { V3Topbar } from "@/components/v3-topbar"
import { ContextBankPanel } from "@/components/context-bank-panel"
import { OnboardingModal } from "@/components/onboarding-modal"
import { PageTransition } from "@/components/transitions"

export function V3Layout(props: ParentProps) {
  const params = useParams()
  const layout = useLayout()
  const dir = createMemo(() => decode64(params.dir) ?? "")
  const project = createMemo(() =>
    layout.projects.list().find((item) => item.worktree === dir() || item.sandboxes?.includes(dir())),
  )
  const projectName = createMemo(() => project()?.name || getFilename(dir()) || "Ideaspace")
  return (
    <div class="flex flex-col h-screen bg-background-base">
      <V3Topbar projectName={projectName()} />
      <div class="flex flex-1 overflow-hidden">
        <V3Sidebar />
        <main class="flex-1 overflow-hidden">
          <PageTransition>{props.children}</PageTransition>
        </main>
        <ContextBankPanel />
      </div>
      <OnboardingModal />
    </div>
  )
}

export default V3Layout
