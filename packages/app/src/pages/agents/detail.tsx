import { Component, createSignal, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { AgentList } from "./list"
import { useAgents } from "@/context/agents"
import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { Icon } from "@opencode-ai/ui/icon"
import type { Agent } from "@opencode-ai/sdk/v2/client"

const modeOptions = [
  { value: "primary", label: "Primary" },
  { value: "subagent", label: "Subagent" },
  { value: "all", label: "All" },
]

export const AgentDetail: Component = () => {
  const agents = useAgents()
  const [selected, setSelected] = createSignal<string | undefined>(undefined)
  const [store] = createStore({
    isEditing: false,
  })

  const agent = () => {
    const name = selected()
    if (!name) return undefined
    return agents.get(name)
  }

  const handleSelect = (a: Agent) => {
    setSelected(a.name)
  }

  return (
    <div class="flex h-full w-full flex-col lg:flex-row">
      {/* Left pane - Agent List */}
      <div class="flex h-full w-full flex-col border-r border-border-weak-base lg:w-80 xl:w-96">
        <div class="flex items-center justify-between border-b border-border-weak-base px-4 py-3">
          <h2 class="text-16-semibold text-text-strong">Agents</h2>
          <Button size="small" variant="secondary">
            <Icon name="plus" size="small" />
            <span class="hidden sm:inline">Create</span>
          </Button>
        </div>
        <div class="flex-1 overflow-hidden p-4">
          <AgentList selected={selected()} onSelect={handleSelect} />
        </div>
      </div>

      {/* Right pane - Agent Editor */}
      <div class="flex h-full flex-1 flex-col overflow-hidden bg-background-base">
        <Show
          when={agent()}
          fallback={
            <div class="flex h-full flex-col items-center justify-center p-8 text-center">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised-base">
                <Icon name="brain" size="large" class="text-text-weak" />
              </div>
              <h3 class="text-16-medium text-text-strong">Select an agent</h3>
              <p class="mt-1 text-13-regular text-text-weak">
                Choose an agent from the list to view and edit its configuration
              </p>
            </div>
          }
        >
          {(a) => (
            <>
              {/* Header */}
              <div class="flex items-center justify-between border-b border-border-weak-base px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-base/10">
                    <Icon name="brain" size="small" class="text-accent-base" />
                  </div>
                  <div>
                    <h2 class="text-16-semibold text-text-strong">{a().name}</h2>
                    <Show when={a().native}>
                      <span class="text-11-medium text-accent-base">Built-in</span>
                    </Show>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Show when={a().native}>
                    <Button size="small" variant="ghost">
                      Reset
                    </Button>
                  </Show>
                  <Show when={!a().native}>
                    <Button size="small" variant="ghost" class="text-danger-base">
                      <Icon name="trash" size="small" />
                      Delete
                    </Button>
                  </Show>
                  <Button size="small" variant="primary" disabled={!store.isEditing}>
                    <Icon name="check" size="small" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Form Content */}
              <div class="flex-1 overflow-y-auto p-6">
                <div class="mx-auto max-w-3xl space-y-8">
                  {/* Basic Info Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Basic Info</h3>
                    <div class="space-y-4 rounded-lg bg-surface-raised-base p-4">
                      <TextField
                        label="Name"
                        value={a().name}
                        readOnly={a().native}
                        description={
                          a().native ? "Built-in agent names cannot be changed" : "Unique identifier for this agent"
                        }
                      />
                      <TextField
                        label="Description"
                        value={a().description ?? ""}
                        description="Brief description of the agent's purpose"
                      />
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Mode</span>
                        <Select
                          options={modeOptions}
                          current={modeOptions.find((o) => o.value === a().mode)}
                          value={(o) => o.value}
                          label={(o) => o.label}
                          variant="secondary"
                          size="small"
                          triggerVariant="settings"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Model Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Model</h3>
                    <div class="space-y-4 rounded-lg bg-surface-raised-base p-4">
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Model</span>
                        <div class="flex items-center gap-2 text-13-regular text-text-weak">
                          <Icon name="models" size="small" />
                          <span>Model selector placeholder</span>
                        </div>
                      </div>
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Temperature</span>
                        <div class="flex items-center gap-2 text-13-regular text-text-weak">
                          <Icon name="sliders" size="small" />
                          <span>Temperature slider placeholder (0.0 - 2.0)</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Prompt Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">System Prompt</h3>
                    <div class="rounded-lg bg-surface-raised-base p-4">
                      <TextField
                        label="Prompt"
                        multiline
                        value=""
                        placeholder="Enter system prompt instructions..."
                        description="Instructions that define how this agent behaves"
                        class="min-h-[150px]"
                      />
                    </div>
                  </section>

                  {/* Permissions Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Permissions</h3>
                    <div class="space-y-4 rounded-lg bg-surface-raised-base p-4">
                      <div>
                        <h4 class="text-13-medium text-text-strong">File System</h4>
                        <p class="text-12-regular text-text-weak">Control file read and edit permissions</p>
                        <div class="mt-2 flex items-center gap-2 text-13-regular text-text-weak">
                          <Icon name="folder" size="small" />
                          <span>File permissions placeholder</span>
                        </div>
                      </div>
                      <div class="border-t border-border-weak-base pt-4">
                        <h4 class="text-13-medium text-text-strong">Network</h4>
                        <p class="text-12-regular text-text-weak">Web fetch and search permissions</p>
                        <div class="mt-2 flex items-center gap-2 text-13-regular text-text-weak">
                          <Icon name="providers" size="small" />
                          <span>Network permissions placeholder</span>
                        </div>
                      </div>
                      <div class="border-t border-border-weak-base pt-4">
                        <h4 class="text-13-medium text-text-strong">Tools</h4>
                        <p class="text-12-regular text-text-weak">Shell and bash execution permissions</p>
                        <div class="mt-2 flex items-center gap-2 text-13-regular text-text-weak">
                          <Icon name="console" size="small" />
                          <span>Tool permissions placeholder</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* MCPs Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">MCP Servers</h3>
                    <div class="rounded-lg bg-surface-raised-base p-4">
                      <p class="mb-3 text-12-regular text-text-weak">Select which MCP servers this agent can access</p>
                      <div class="flex items-center gap-2 text-13-regular text-text-weak">
                        <Icon name="mcp" size="small" />
                        <span>MCP selection placeholder</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}
