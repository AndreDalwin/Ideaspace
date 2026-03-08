import { createSignal, For } from "solid-js"
import { A, useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
import { V3FileTreeWithMenu } from "./v3-file-tree-with-menu"

const defaultSkills = [
  { id: "write", name: "Write Content", icon: "✍️", description: "Technical writing and documentation" },
  { id: "review", name: "Code Review", icon: "👨‍💻", description: "Review and improve code" },
  { id: "plan", name: "Project Plan", icon: "📊", description: "Plan and organize work" },
]

export function V3Sidebar() {
  const navigate = useNavigate()
  const params = useParams()
  const [sessions] = createSignal([{ id: "1", name: "First workspace", preview: "Getting started...", time: "2h ago" }])
  return (
    <aside class="w-64 border-r border-border-weak-base bg-background-stronger flex flex-col">
      <div class="p-3 space-y-2">
        <A
          href={`/${params.dir || "."}/v3`}
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-13-medium text-text-strong hover:bg-background-base transition-all duration-150"
          activeClass="bg-accent-primary/10 text-accent-primary"
        >
          <span>🏠</span>
          <span>Home</span>
        </A>
        <Button
          variant="secondary"
          size="small"
          class="w-full justify-start gap-2"
          onClick={() => navigate(`/${params.dir || "."}/session`)}
        >
          <span>➕</span>
          <span>New Session</span>
        </Button>
      </div>
      <ScrollView class="flex-1">
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">My Work</div>
          <For each={sessions()}>
            {(session) => (
              <button
                class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-all duration-150 group hover-lift"
                onClick={() => navigate(`/${params.dir || "."}/session/${session.id}`)}
              >
                <div class="text-13-medium text-text-strong truncate">{session.name}</div>
                <div class="text-11-regular text-text-weak truncate">{session.preview}</div>
              </button>
            )}
          </For>
        </div>
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Skills</div>
          <For each={defaultSkills}>
            {(skill) => (
              <button
                class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-all duration-150 flex items-center gap-2 group hover-lift"
                onClick={() => navigate(`/${params.dir || "."}/session?skill=${skill.id}`)}
                title={skill.description}
              >
                <span class="text-16">{skill.icon}</span>
                <span class="text-13-regular text-text-strong">{skill.name}</span>
              </button>
            )}
          </For>
          <button
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-background-base transition-all duration-150 text-13-regular text-accent-primary flex items-center gap-2 hover-lift"
            onClick={() => navigate(`/${params.dir || "."}/skills/new`)}
          >
            <span>➕</span>
            <span>Create Skill</span>
          </button>
        </div>
        <div class="px-3 py-2">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Tasks</div>
          <A
            href={`/${params.dir || "."}/tasks`}
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-13-medium text-text-strong hover:bg-background-base transition-all duration-150"
            activeClass="bg-accent-primary/10 text-accent-primary"
          >
            <span>📋</span>
            <span>Tasks</span>
          </A>
        </div>
        <div class="flex-1 flex flex-col min-h-0">
          <div class="text-11-medium text-text-weak uppercase tracking-wider mb-2 px-3">Files</div>
          <div class="flex-1 min-h-0">
            <V3FileTreeWithMenu />
          </div>
        </div>
      </ScrollView>
    </aside>
  )
}
