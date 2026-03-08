import { For, Show, createSignal, createMemo } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useContextBank } from "@/context/context-bank"
import type { ContextSet } from "@/types/context"
import { TaskContextPanel } from "./task-context-panel"
import { ContextEmptyState } from "./context-empty-state"
import { FadeIn, StaggerItem } from "./transitions"

export function ContextBankPanel() {
  const { state, actions } = useContextBank()
  const [activeTab, setActiveTab] = createSignal<"global" | "sets" | "session">("global")
  const [expandedSets, setExpandedSets] = createSignal<Set<string>>(new Set())
  const [showAddSet, setShowAddSet] = createSignal(false)
  const [newSetName, setNewSetName] = createSignal("")

  const totalTokens = createMemo(() => {
    const paths = state.global.files
    return actions.calculateTokens(paths)
  })

  const toggleSetExpanded = (id: string) => {
    setExpandedSets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreateSet = () => {
    const name = newSetName().trim()
    if (!name) return

    const set: ContextSet = {
      id: crypto.randomUUID(),
      name,
      description: "",
      files: [],
      createdAt: Date.now(),
    }

    actions.addSet(set)
    setNewSetName("")
    setShowAddSet(false)
  }

  return (
    <aside class="w-72 border-l border-border flex flex-col bg-background-base">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 class="font-semibold text-sm">Context Bank</h2>
        <div class="flex items-center gap-1">
          <Button
            size="small"
            variant="ghost"
            onClick={() => setActiveTab("global")}
            class={activeTab() === "global" ? "bg-accent" : ""}
          >
            <Icon name="eye" class="size-4" />
          </Button>
          <Button
            size="small"
            variant="ghost"
            onClick={() => setActiveTab("sets")}
            class={activeTab() === "sets" ? "bg-accent" : ""}
          >
            <Icon name="folder" class="size-4" />
          </Button>
          <Button
            size="small"
            variant="ghost"
            onClick={() => setActiveTab("session")}
            class={activeTab() === "session" ? "bg-accent" : ""}
          >
            <Icon name="speech-bubble" class="size-4" />
          </Button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        <Show when={activeTab() === "global"}>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Global Context</span>
              <span class="text-xs text-muted-foreground">{totalTokens()} tokens</span>
            </div>

            <Show
              when={state.global.files.length > 0}
              fallback={
                <FadeIn>
                  <ContextEmptyState type="files" />
                </FadeIn>
              }
            >
              <div class="space-y-1">
                <For each={state.global.files}>
                  {(path, idx) => {
                    const file = state.files.find((f) => f.path === path)
                    return (
                      <StaggerItem index={idx()}>
                        <div class="flex items-center justify-between p-2 rounded hover:bg-accent group">
                          <div class="flex items-center gap-2 min-w-0">
                            <Icon
                              name={file?.type === "folder" ? "folder" : "code-lines"}
                              class="size-4 text-muted-foreground shrink-0"
                            />
                            <span class="text-sm truncate">{file?.name || path}</span>
                          </div>
                          <Button
                            size="small"
                            variant="ghost"
                            class="opacity-0 group-hover:opacity-100 size-6 p-0"
                            onClick={() => actions.removeFromGlobal(path)}
                          >
                            <Icon name="close" class="size-3" />
                          </Button>
                        </div>
                      </StaggerItem>
                    )
                  }}
                </For>
              </div>
            </Show>

            <TaskContextPanel />
          </div>
        </Show>

        <Show when={activeTab() === "sets"}>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Context Sets</span>
              <Button size="small" variant="ghost" class="size-6 p-0" onClick={() => setShowAddSet(true)}>
                <Icon name="plus" class="size-4" />
              </Button>
            </div>

            <Show when={showAddSet()}>
              <div class="flex items-center gap-2 p-2 rounded bg-accent">
                <input
                  type="text"
                  value={newSetName()}
                  onInput={(e) => setNewSetName(e.currentTarget.value)}
                  placeholder="Set name..."
                  class="flex-1 bg-transparent text-sm outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSet()}
                />
                <Button size="small" variant="ghost" class="size-6 p-0" onClick={handleCreateSet}>
                  <Icon name="check" class="size-4" />
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  class="size-6 p-0"
                  onClick={() => {
                    setShowAddSet(false)
                    setNewSetName("")
                  }}
                >
                  <Icon name="close" class="size-4" />
                </Button>
              </div>
            </Show>

            <Show
              when={state.sets.length > 0}
              fallback={
                <FadeIn>
                  <ContextEmptyState type="sets" />
                </FadeIn>
              }
            >
              <div class="space-y-1">
                <For each={state.sets}>
                  {(set, idx) => {
                    const isExpanded = () => expandedSets().has(set.id)
                    const setTokens = () => actions.calculateTokens(set.files)

                    return (
                      <StaggerItem index={idx()}>
                        <div class="border border-border rounded overflow-hidden">
                          <button
                            class="w-full flex items-center justify-between p-2 hover:bg-accent"
                            onClick={() => toggleSetExpanded(set.id)}
                          >
                            <div class="flex items-center gap-2 min-w-0">
                              <Icon
                                name={isExpanded() ? "chevron-down" : "chevron-right"}
                                class="size-4 text-muted-foreground shrink-0"
                              />
                              <Show when={set.icon}>
                                <Icon name={set.icon as "folder"} class="size-4 text-muted-foreground shrink-0" />
                              </Show>
                              <span class="text-sm font-medium truncate">{set.name}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-xs text-muted-foreground">{setTokens()} tokens</span>
                              <Button
                                size="small"
                                variant="ghost"
                                class="opacity-0 group-hover:opacity-100 size-6 p-0"
                                onClick={(e: MouseEvent) => {
                                  e.stopPropagation()
                                  actions.removeSet(set.id)
                                }}
                              >
                                <Icon name="close" class="size-3" />
                              </Button>
                            </div>
                          </button>

                          <Show when={isExpanded()}>
                            <div class="px-2 pb-2 space-y-1">
                              <Show
                                when={set.files.length > 0}
                                fallback={
                                  <div class="text-xs text-muted-foreground text-center py-2">No files in this set</div>
                                }
                              >
                                <For each={set.files}>
                                  {(path) => {
                                    const file = state.files.find((f) => f.path === path)
                                    return (
                                      <div class="flex items-center justify-between p-2 rounded hover:bg-accent/50 group">
                                        <div class="flex items-center gap-2 min-w-0">
                                          <Icon
                                            name={file?.type === "folder" ? "folder" : "code-lines"}
                                            class="size-3 text-muted-foreground shrink-0"
                                          />
                                          <span class="text-xs truncate">{file?.name || path}</span>
                                        </div>
                                        <Button
                                          size="small"
                                          variant="ghost"
                                          class="opacity-0 group-hover:opacity-100 size-5 p-0"
                                          onClick={() =>
                                            actions.updateSet(set.id, {
                                              files: set.files.filter((p) => p !== path),
                                            })
                                          }
                                        >
                                          <Icon name="close" class="size-3" />
                                        </Button>
                                      </div>
                                    )
                                  }}
                                </For>
                              </Show>
                            </div>
                          </Show>
                        </div>
                      </StaggerItem>
                    )
                  }}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        <Show when={activeTab() === "session"}>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Session Context</span>
            </div>
            <div class="text-sm text-muted-foreground text-center py-8">Session context will appear here</div>
          </div>
        </Show>
      </div>
    </aside>
  )
}
