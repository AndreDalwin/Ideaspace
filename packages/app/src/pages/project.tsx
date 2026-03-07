import { A, useLocation, useParams } from "@solidjs/router"
import { getFilename } from "@opencode-ai/util/path"
import { Match, type ParentProps, Switch, createMemo } from "solid-js"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { ProjectTabs } from "@/components/project-tabs"
import Workspace from "./workspace"
import Tasks from "./tasks"

function Pane(props: ParentProps<{ title: string; note: string }>) {
  return (
    <section class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
      <div class="mb-4 flex flex-col gap-1">
        <h2 class="text-16-medium text-text-strong">{props.title}</h2>
        <p class="text-13-regular text-text-weak">{props.note}</p>
      </div>
      {props.children}
    </section>
  )
}

function Agents() {
  return (
    <div class="flex flex-col gap-5">
      <Pane
        title="Agents"
        note="Agent dashboard coming soon. This will show live execution, ownership, and configuration."
      >
        <div class="p-8 text-center text-13-regular text-text-weak">
          Agent management is planned for a future release.
        </div>
      </Pane>
    </div>
  )
}

function Context() {
  return (
    <div class="flex flex-col gap-5">
      <Pane
        title="Context"
        note="Context Bank coming soon. This will be a shared knowledge base for documents and research."
      >
        <div class="p-8 text-center text-13-regular text-text-weak">Context Bank is planned for a future release.</div>
      </Pane>
    </div>
  )
}

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
            <Workspace />
          </Match>
          <Match when={view() === "tasks"}>
            <Tasks />
          </Match>
          <Match when={view() === "agents"}>
            <Agents />
          </Match>
          <Match when={view() === "context"}>
            <Context />
          </Match>
        </Switch>
      </div>
    </div>
  )
}
