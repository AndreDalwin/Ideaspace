import { A, useLocation, useParams } from "@solidjs/router"
import { getFilename } from "@opencode-ai/util/path"
import { For, Match, type ParentProps, Switch, createMemo } from "solid-js"
import { useLayout } from "@/context/layout"
import { decode64 } from "@/utils/base64"
import { ProjectTabs } from "@/components/project-tabs"

const docs = [
  {
    name: "product-roadmap.md",
    note: "Strategy, milestones, planning context",
    tone: "bg-accent-primary/12 text-text-strong",
  },
  {
    name: "launch-checklist.md",
    note: "Release steps, QA, go-live tasks",
    tone: "bg-surface-warning-base/18 text-text-strong",
  },
  {
    name: "meeting-notes.md",
    note: "Founder syncs, user calls, decision log",
    tone: "bg-surface-success-base/18 text-text-strong",
  },
  {
    name: "api-spec.yaml",
    note: "Backend contracts and integration notes",
    tone: "bg-surface-info-base/18 text-text-strong",
  },
] as const

const board = {
  todo: ["Set up project shell", "Define planner flow", "Draft data model"],
  progress: ["Workspace UX scaffold", "Brand rename pass"],
  review: ["Agent dashboard IA"],
  done: ["Detach upstream remote"],
}

const jobs = [
  {
    name: "Planner",
    note: "Turns ideas into milestones, specs, and launch plans.",
    steps: ["Roadmap draft", "PRD outline", "Execution checklist"],
  },
  {
    name: "Builder",
    note: "Owns implementation sessions and hands off code-ready tasks.",
    steps: ["Feature branch", "Implementation", "Verification"],
  },
  {
    name: "Research",
    note: "Collects references, competitor notes, and technical context.",
    steps: ["Source scan", "Summary", "Recommendation"],
  },
] as const

const sources = [
  { name: "Customer notes", note: "Interview snippets and problem statements" },
  { name: "Product docs", note: "Specs, roadmaps, launch docs, decisions" },
  { name: "Code context", note: "Architecture notes, APIs, data contracts" },
  { name: "Research links", note: "Benchmarks, examples, external references" },
] as const

const snippets = [
  "Planner agents should turn an idea into a roadmap, PRD, and milestone-ready task list.",
  "Project tabs should feel like a workspace, not just a chat transcript.",
  "Context needs to be reusable by multiple agents inside the same project.",
] as const

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

function Workspace() {
  const params = useParams()
  const seed = encodeURIComponent(
    "Act as the Ideaspace planner. Turn this project into a roadmap, milestone plan, and first implementation backlog.",
  )

  return (
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Pane title="Workspace" note="Use this tab as the planning home for docs, specs, and AI-assisted execution.">
        <div class="grid gap-3 md:grid-cols-2">
          <For each={docs}>
            {(doc) => (
              <div class="rounded-2xl border border-border-weak-base bg-background-base p-4">
                <div class={`mb-3 inline-flex rounded-full px-2.5 py-1 text-11-medium ${doc.tone}`}>{doc.name}</div>
                <div class="text-14-medium text-text-strong">Starter artifact</div>
                <div class="mt-1 text-13-regular text-text-weak">{doc.note}</div>
              </div>
            )}
          </For>
        </div>
      </Pane>

      <div class="flex flex-col gap-5">
        <Pane
          title="AI actions"
          note="Keep AI central, but make it one tool inside the workspace instead of the whole product."
        >
          <div class="flex flex-col gap-3">
            <A
              href={`/${params.dir}/session?prompt=${seed}`}
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-accent-primary px-4 text-13-medium text-black"
            >
              Start planner session
            </A>
            <A
              href={`/${params.dir}/session`}
              class="inline-flex h-11 items-center justify-center rounded-2xl border border-border-strong-base px-4 text-13-medium text-text-strong"
            >
              Open AI session
            </A>
          </div>
        </Pane>

        <Pane
          title="What your friend can branch from"
          note="These shells are intentionally simple so each tab can evolve independently."
        >
          <ul class="flex flex-col gap-3 text-13-regular text-text-weak">
            <li>Workspace can become the markdown and planner surface.</li>
            <li>Tasks can get real Kanban data and drag/drop next.</li>
            <li>Agents can expose live runs, logs, and per-agent config.</li>
            <li>Context can become the shared memory layer for every project agent.</li>
          </ul>
        </Pane>
      </div>
    </div>
  )
}

function Tasks() {
  const cols = [
    { name: "To do", items: board.todo },
    { name: "In progress", items: board.progress },
    { name: "Review", items: board.review },
    { name: "Done", items: board.done },
  ] as const

  return (
    <Pane
      title="Tasks"
      note="Starter Kanban scaffold so feature branches can replace placeholders with real project task data."
    >
      <div class="grid gap-4 xl:grid-cols-4">
        <For each={cols}>
          {(col) => (
            <div class="rounded-2xl border border-border-weak-base bg-background-base p-3">
              <div class="mb-3 flex items-center justify-between">
                <div class="text-13-medium text-text-strong">{col.name}</div>
                <div class="text-12-regular text-text-weak">{col.items.length}</div>
              </div>
              <div class="flex flex-col gap-3">
                <For each={col.items}>
                  {(item) => (
                    <div class="rounded-xl border border-border-weak-base bg-background-stronger p-3">
                      <div class="text-13-medium text-text-strong">{item}</div>
                      <div class="mt-1 text-12-regular text-text-weak">Ideaspace starter task card</div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </Pane>
  )
}

function Agents() {
  const stats = [
    { label: "Running", value: "3" },
    { label: "Queued", value: "5" },
    { label: "Completed", value: "24" },
    { label: "Failed", value: "1" },
  ] as const

  return (
    <div class="flex flex-col gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <For each={stats}>
          {(stat) => (
            <div class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
              <div class="text-12-medium uppercase tracking-[0.16em] text-text-weak">{stat.label}</div>
              <div class="mt-3 text-32-semibold text-text-strong">{stat.value}</div>
            </div>
          )}
        </For>
      </div>

      <Pane
        title="Agents"
        note="Starter dashboard for live execution, ownership, and personality/tool configuration later."
      >
        <div class="grid gap-4 xl:grid-cols-3">
          <For each={jobs}>
            {(job) => (
              <div class="rounded-2xl border border-border-weak-base bg-background-base p-4">
                <div class="text-15-medium text-text-strong">{job.name}</div>
                <div class="mt-1 text-13-regular text-text-weak">{job.note}</div>
                <div class="mt-4 flex flex-col gap-2">
                  <For each={job.steps}>
                    {(step, idx) => (
                      <div class="flex items-center gap-2 text-12-regular text-text-weak">
                        <div class="flex size-5 items-center justify-center rounded-full border border-border-strong-base text-11-medium text-text-strong">
                          {idx() + 1}
                        </div>
                        <span>{step}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Pane>
    </div>
  )
}

function Context() {
  return (
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <Pane
        title="Context"
        note="Shared knowledge base starter for documents, snippets, and research every agent can reuse."
      >
        <div class="flex flex-col gap-3">
          <For each={sources}>
            {(item) => (
              <div class="rounded-2xl border border-border-weak-base bg-background-base p-4">
                <div class="text-14-medium text-text-strong">{item.name}</div>
                <div class="mt-1 text-13-regular text-text-weak">{item.note}</div>
              </div>
            )}
          </For>
        </div>
      </Pane>

      <Pane
        title="Pinned snippets"
        note="Example memory fragments that later branches can turn into searchable and agent-ready knowledge."
      >
        <div class="flex flex-col gap-3">
          <For each={snippets}>
            {(item) => (
              <div class="rounded-2xl border border-border-weak-base bg-background-base p-4 text-13-regular text-text-weak">
                “{item}”
              </div>
            )}
          </For>
        </div>
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
