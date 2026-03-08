import { A, useLocation, useParams } from "@solidjs/router"
import { For } from "solid-js"

const tabs = [
  { id: "plan", label: "Plan" },
  { id: "kanban", label: "Kanban" },
  { id: "session", label: "Session" },
] as const

export function ProjectTabs() {
  const params = useParams()
  const location = useLocation()

  const href = (id: (typeof tabs)[number]["id"]) => {
    if (id === "session") {
      if (params.id) return `/${params.dir}/session/${params.id}`
      return `/${params.dir}/session`
    }

    if (params.id) return `/${params.dir}/${id}/${params.id}`
    return `/${params.dir}/${id}`
  }

  const active = (id: (typeof tabs)[number]["id"]) => {
    if (id === "session") return location.pathname.startsWith(`/${params.dir}/session`)
    return location.pathname.startsWith(`/${params.dir}/${id}`)
  }

  return (
    <div class="border-b border-border-weak-base px-4 pb-3">
      <div class="flex flex-wrap gap-2">
        <For each={tabs}>
          {(tab) => (
            <A
              href={href(tab.id)}
              class="inline-flex h-9 items-center rounded-full border px-3 text-12-medium transition-colors"
              classList={{
                "border-accent-primary bg-accent-primary/12 text-text-strong": active(tab.id),
                "border-border-weak-base text-text-weak hover:border-border-strong-base hover:text-text-strong":
                  !active(tab.id),
              }}
            >
              {tab.label}
            </A>
          )}
        </For>
      </div>
    </div>
  )
}
