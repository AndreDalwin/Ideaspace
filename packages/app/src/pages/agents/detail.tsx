import { Component, createSignal, For, onMount, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { AgentList } from "./list"
import { useAgents } from "@/context/agents"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { Checkbox } from "@opencode-ai/ui/checkbox"
import { Icon } from "@opencode-ai/ui/icon"
import type { Agent, AgentConfig } from "@opencode-ai/sdk/v2/client"

type PermissionLevel = "allow" | "ask" | "deny"

interface PermissionState {
  fileRead: PermissionLevel
  fileEdit: PermissionLevel
  filePaths: string
  webfetch: PermissionLevel
  websearch: PermissionLevel
  bash: PermissionLevel
  bashPaths: string
  other: PermissionLevel
}

interface FormState {
  name: string
  description: string
  mode: "primary" | "subagent" | "all"
  nameError: string | undefined
  isEditing: boolean
}

type MCP = {
  name: string
  status: string
  type: "local" | "remote"
}

const levelOptions: { value: PermissionLevel; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "ask", label: "Ask" },
  { value: "deny", label: "Deny" },
]

function PermissionRow(props: {
  label: string
  desc: string
  level: PermissionLevel
  onChange: (v: PermissionLevel) => void
  children?: any
}) {
  return (
    <div class="space-y-3">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-13-medium text-text-strong">{props.label}</h4>
          <p class="text-12-regular text-text-weak">{props.desc}</p>
        </div>
        <RadioGroup
          options={levelOptions}
          current={levelOptions.find((o) => o.value === props.level)}
          value={(o) => o.value}
          label={(o) => o.label}
          onSelect={(o) => o && props.onChange(o.value)}
          size="small"
        />
      </div>
      {props.children}
    </div>
  )
}

const promptPlaceholder = `You are a helpful coding assistant. Your role is to:

- Write clean, maintainable code following best practices
- Explain your reasoning when making changes
- Ask clarifying questions when requirements are unclear
- Consider edge cases and error handling

Example response format:
1. Brief explanation of the approach
2. The code solution
3. Any important considerations`

const modeOptions = [
  { value: "primary", label: "Primary" },
  { value: "subagent", label: "Subagent" },
  { value: "all", label: "All" },
]

export const AgentDetail: Component = () => {
  const agents = useAgents()
  const sdk = useSDK()
  const sync = useSync()
  const [selected, setSelected] = createSignal<string | undefined>(undefined)
  const [expanded, setExpanded] = createSignal(true)
  const [prompt, setPrompt] = createSignal("")
  const [mcps, setMcps] = createSignal<MCP[]>([])
  const [selectedMcps, setSelectedMcps] = createSignal<Set<string>>(new Set())
  const [store, setStore] = createStore({
    isEditing: false,
    perms: {
      fileRead: "ask" as PermissionLevel,
      fileEdit: "ask" as PermissionLevel,
      filePaths: "",
      webfetch: "ask" as PermissionLevel,
      websearch: "ask" as PermissionLevel,
      bash: "ask" as PermissionLevel,
      bashPaths: "",
      other: "ask" as PermissionLevel,
    } satisfies PermissionState,
  })
  const [form, setForm] = createStore<FormState>({
    name: "",
    description: "",
    mode: "primary",
    nameError: undefined,
    isEditing: false,
  })

  const agent = () => {
    const name = selected()
    if (!name) return undefined
    return agents.get(name)
  }

  onMount(async () => {
    const result = await sdk.client.mcp.status()
    if (result.data) {
      const mcpList: MCP[] = Object.entries(result.data).map(([name, info]: [string, any]) => ({
        name,
        status: info.status,
        type: info.type === "remote" ? "remote" : "local",
      }))
      setMcps(mcpList)
    }
  })

  const toggleMcp = (name: string) => {
    setSelectedMcps((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
    setStore("isEditing", true)
  }

  const validateName = (name: string, currentName: string): string | undefined => {
    if (!name.trim()) return "Name is required"
    if (name !== currentName) {
      const exists = agents.list.some((a) => a.name === name)
      if (exists) return "An agent with this name already exists"
    }
    return undefined
  }

  const handleNameChange = (value: string) => {
    const a = agent()
    if (!a || a.native) return

    setForm("name", value)
    const error = validateName(value, a.name)
    setForm("nameError", error)
    setForm("isEditing", !error)
  }

  const handleDescriptionChange = (value: string) => {
    const a = agent()
    if (!a) return

    setForm("description", value)
    setForm("isEditing", true)

    const config: Partial<AgentConfig> = { description: value }
    void agents.update(a.name, config)
  }

  const handleModeChange = (option: { value: string; label: string } | undefined) => {
    const a = agent()
    if (!a || !option) return

    const mode = option.value as "primary" | "subagent" | "all"
    setForm("mode", mode)
    setForm("isEditing", true)

    const config: Partial<AgentConfig> = { mode }
    void agents.update(a.name, config)
  }

  const handleSelect = (a: Agent) => {
    setSelected(a.name)
    const mcps = (a as any).mcps
    setSelectedMcps(new Set<string>(mcps ?? []))
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
                  <Button size="small" variant="primary" disabled={!form.isEditing && !store.isEditing}>
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
                        value={form.name}
                        onChange={handleNameChange}
                        readOnly={a().native}
                        error={form.nameError}
                        validationState={form.nameError ? "invalid" : "valid"}
                        description={
                          a().native ? "Built-in agent names cannot be changed" : "Unique identifier for this agent"
                        }
                      />
                      <TextField
                        label="Description"
                        value={form.description}
                        onChange={handleDescriptionChange}
                        description="Brief description of the agent's purpose"
                      />
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Mode</span>
                        <Select
                          options={modeOptions}
                          current={modeOptions.find((o) => o.value === form.mode)}
                          onSelect={handleModeChange}
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
                    <button
                      type="button"
                      class="mb-4 flex w-full items-center justify-between text-left"
                      onClick={() => setExpanded(!expanded())}
                    >
                      <div>
                        <h3 class="text-14-medium text-text-strong">System Prompt</h3>
                        <p class="text-12-regular text-text-weak">Instructions that define how this agent behaves</p>
                      </div>
                      <Icon name={expanded() ? "chevron-down" : "chevron-right"} size="small" class="text-text-weak" />
                    </button>
                    <Show when={expanded()}>
                      <div class="space-y-2 rounded-lg bg-surface-raised-base p-4">
                        <textarea
                          value={prompt()}
                          onInput={(e) => {
                            setPrompt(e.currentTarget.value)
                            setStore("isEditing", true)
                          }}
                          placeholder={promptPlaceholder}
                          class="min-h-[200px] w-full resize-y rounded-md border border-border-weak-base bg-surface-base px-3 py-2 text-13-regular text-text-strong placeholder:text-text-weak focus:border-accent-base focus:outline-none"
                        />
                        <div class="flex justify-end">
                          <span
                            class={
                              prompt().length > 4000
                                ? "text-12-regular text-danger-base"
                                : "text-12-regular text-text-weak"
                            }
                          >
                            {prompt().length.toLocaleString()} / 4,000
                          </span>
                        </div>
                      </div>
                    </Show>
                  </section>

                  {/* Permissions Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Permissions</h3>
                    <div class="space-y-6 rounded-lg bg-surface-raised-base p-4">
                      <div>
                        <div class="mb-3 flex items-center gap-2">
                          <Icon name="folder" size="small" class="text-text-weak" />
                          <h4 class="text-13-semibold text-text-strong">File System</h4>
                        </div>
                        <div class="space-y-4 pl-6">
                          <PermissionRow
                            label="Read files"
                            desc="Access file contents for reading"
                            level={store.perms.fileRead}
                            onChange={(v) => setStore("perms", "fileRead", v)}
                          />
                          <PermissionRow
                            label="Edit files"
                            desc="Modify and write file contents"
                            level={store.perms.fileEdit}
                            onChange={(v) => setStore("perms", "fileEdit", v)}
                          >
                            <TextField
                              label="Allowed paths"
                              multiline
                              value={store.perms.filePaths}
                              onChange={(v) => setStore("perms", "filePaths", v)}
                              placeholder="One path pattern per line...&#10;*&#10;src/**/*&#10;!*.secret"
                              description="Glob patterns for allowed file paths"
                              class="min-h-[80px]"
                            />
                          </PermissionRow>
                        </div>
                      </div>

                      {/* Network */}
                      <div class="border-t border-border-weak-base pt-6">
                        <div class="mb-3 flex items-center gap-2">
                          <Icon name="providers" size="small" class="text-text-weak" />
                          <h4 class="text-13-semibold text-text-strong">Network</h4>
                        </div>
                        <div class="space-y-4 pl-6">
                          <PermissionRow
                            label="Web fetch"
                            desc="Make HTTP requests to external APIs"
                            level={store.perms.webfetch}
                            onChange={(v) => setStore("perms", "webfetch", v)}
                          />
                          <PermissionRow
                            label="Web search"
                            desc="Search the internet for information"
                            level={store.perms.websearch}
                            onChange={(v) => setStore("perms", "websearch", v)}
                          />
                        </div>
                      </div>

                      {/* Tools */}
                      <div class="border-t border-border-weak-base pt-6">
                        <div class="mb-3 flex items-center gap-2">
                          <Icon name="console" size="small" class="text-text-weak" />
                          <h4 class="text-13-semibold text-text-strong">Tools</h4>
                        </div>
                        <div class="space-y-4 pl-6">
                          <PermissionRow
                            label="Bash execution"
                            desc="Run shell commands and scripts"
                            level={store.perms.bash}
                            onChange={(v) => setStore("perms", "bash", v)}
                          >
                            <TextField
                              label="Allowed paths"
                              multiline
                              value={store.perms.bashPaths}
                              onChange={(v) => setStore("perms", "bashPaths", v)}
                              placeholder="One working directory per line...&#10;/project&#10;/tmp"
                              description="Directories where bash commands can be executed"
                              class="min-h-[80px]"
                            />
                          </PermissionRow>
                        </div>
                      </div>

                      <div class="border-t border-border-weak-base pt-6">
                        <div class="mb-3 flex items-center gap-2">
                          <Icon name="sliders" size="small" class="text-text-weak" />
                          <h4 class="text-13-semibold text-text-strong">Other</h4>
                        </div>
                        <div class="pl-6">
                          <PermissionRow
                            label="Other permissions"
                            desc="Access to additional tools and APIs"
                            level={store.perms.other}
                            onChange={(v) => setStore("perms", "other", v)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* MCPs Section */}
                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">MCP Servers</h3>
                    <div class="rounded-lg bg-surface-raised-base p-4">
                      <p class="mb-3 text-12-regular text-text-weak">Select which MCP servers this agent can access</p>
                      <Show
                        when={mcps().length > 0}
                        fallback={
                          <div class="flex items-center gap-2 text-13-regular text-text-weak">
                            <Icon name="mcp" size="small" />
                            <span>No MCP servers available</span>
                          </div>
                        }
                      >
                        <div class="space-y-2">
                          <For each={mcps()}>
                            {(mcp) => (
                              <div class="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-surface-base">
                                <Checkbox checked={selectedMcps().has(mcp.name)} onChange={() => toggleMcp(mcp.name)} />
                                <div class="flex flex-1 items-center justify-between">
                                  <span class="text-13-medium text-text-strong">{mcp.name}</span>
                                  <div class="flex items-center gap-2">
                                    <span
                                      class={
                                        mcp.type === "local"
                                          ? "text-11-medium text-text-weak"
                                          : "text-11-medium text-accent-base"
                                      }
                                    >
                                      {mcp.type}
                                    </span>
                                    <span
                                      class={
                                        mcp.status === "connected"
                                          ? "text-11-medium text-success-base"
                                          : "text-11-medium text-text-weaker"
                                      }
                                    >
                                      {mcp.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
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
