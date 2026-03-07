import { A, useLocation, useParams } from "@solidjs/router"
import { getFilename } from "@opencode-ai/util/path"
import { Match, Switch, createMemo } from "solid-js"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { ProjectTabs } from "@/components/project-tabs"
import WorkspaceTab from "@/pages/workspace"
import TasksTab from "@/pages/tasks"
import AgentsTab from "@/pages/agents-tab"
import ContextTab from "@/pages/context-tab"

export default function ProjectPage() {
  const params = useParams()
  const location = useLocation()
  const layout = useLayout()
  const dir = createMemo(() => decode64(params.dir) ?? "")
  const project = createMemo(() =>
    layout.projects.list().find((item) => item.worktree === dir() || item.sandboxes?.includes(dir())),
  )
  const name = createMemo(() => (project()?.name ?? getFilename(dir())) || "Ideaspace project")
  const view = createMemo(() => location.pathname.split("/").at(-1) ?? "workspace")

  return (
    <div class="size-full overflow-hidden bg-background-base flex flex-col">
      <div class="border-b border-border-weak-base px-4 pt-5 pb-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex flex-col gap-1">
            <div class="text-12-medium uppercase tracking-[0.16em] text-text-weak">Ideaspace project</div>
            <h1 class="text-28-medium text-text-strong">{name()}</h1>
            <p class="text-13-regular text-text-weak">
              Desktop-first project shell for planning, tasks, agent visibility, shared context, and AI sessions.
            </p>
          </div>
          <A
            href={`/${params.dir}/session`}
            class="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-primary px-4 text-13-medium text-black"
          >
            Open AI session
          </A>
        </div>
      </div>

      <ProjectTabs />

      <div class="flex-1 overflow-auto p-4 md:p-5">
        <Switch>
          <Match when={view() === "workspace"}>
            <WorkspaceTab />
          </Match>
          <Match when={view() === "tasks"}>
            <TasksTab />
          </Match>
          <Match when={view() === "agents"}>
            <AgentsTab />
          </Match>
          <Match when={view() === "context"}>
            <ContextTab />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
