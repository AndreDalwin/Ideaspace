import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { createStore } from "solid-js/store"
import { createMemo, For, Show } from "solid-js"
import { useAgents } from "@/context/agents"
import { useGlobalSync } from "@/context/global-sync"
import type { AgentConfig } from "@opencode-ai/sdk/v2/client"

const RESERVED_NAMES = new Set(["build", "plan", "general", "explore"])

const TEMPLATE_OPTIONS = [
  { value: "empty", label: "Empty" },
  { value: "copy", label: "Copy from existing" },
] as const

interface CreateAgentDialogProps {
  onCreate?: (name: string) => void
}

export function DialogCreateAgent(props: CreateAgentDialogProps) {
  const dialog = useDialog()
  const agents = useAgents()
  const globalSync = useGlobalSync()

  const [store, setStore] = createStore({
    name: "",
    template: "empty" as "empty" | "copy",
    sourceAgent: "",
    creating: false,
    nameError: undefined as string | undefined,
  })

  const nameExists = (name: string) => agents.list.some((a) => a.name === name)

  const isReserved = (name: string) => RESERVED_NAMES.has(name.toLowerCase())

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return "Name is required"
    if (isReserved(name)) return `"${name}" is a reserved name`
    if (nameExists(name)) return "An agent with this name already exists"
    return undefined
  }

  const handleNameChange = (value: string) => {
    setStore("name", value)
    setStore("nameError", validateName(value))
  }

  const canSubmit = createMemo(() => {
    if (!store.name.trim()) return false
    if (store.nameError) return false
    if (store.template === "copy" && !store.sourceAgent) return false
    return true
  })

  const sourceAgentOptions = createMemo(() => agents.list.map((a) => ({ value: a.name, label: a.name })))

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!canSubmit()) return

    const name = store.name.trim()
    const error = validateName(name)
    if (error) {
      setStore("nameError", error)
      return
    }

    setStore("creating", true)

    try {
      let config: AgentConfig = {
        mode: "subagent",
        description: "",
        prompt: "",
      }

      if (store.template === "copy" && store.sourceAgent) {
        const source = agents.getConfig(store.sourceAgent)
        if (source) {
          config = { ...source }
        }
      }

      await globalSync.updateConfig({
        ...globalSync.data.config,
        agent: {
          ...globalSync.data.config?.agent,
          [name]: config,
        },
      })

      dialog.close()
      props.onCreate?.(name)
    } finally {
      setStore("creating", false)
    }
  }

  return (
    <Dialog title="Create Agent" class="w-full max-w-[480px] mx-auto">
      <form onSubmit={handleSubmit} class="flex flex-col gap-6 p-6 pt-0">
        <div class="flex flex-col gap-4">
          <TextField
            autofocus
            type="text"
            label="Name"
            placeholder="e.g., my-agent"
            value={store.name}
            onChange={handleNameChange}
            error={store.nameError}
            validationState={store.nameError ? "invalid" : "valid"}
            description="Unique identifier for this agent"
          />

          <div class="flex flex-col gap-2">
            <span class="text-13-medium text-text-strong">Template</span>
            <div class="flex gap-2">
              <For each={TEMPLATE_OPTIONS}>
                {(option) => (
                  <button
                    type="button"
                    onClick={() => setStore("template", option.value)}
                    classList={{
                      "flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition-colors": true,
                      "border-accent-base bg-accent-base/10 text-accent-base": store.template === option.value,
                      "border-border-weak-base hover:border-border-base": store.template !== option.value,
                    }}
                  >
                    <span class="text-13-medium">{option.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>

          <Show when={store.template === "copy"}>
            <div>
              <span class="mb-1.5 block text-13-medium text-text-strong">Copy from</span>
              <Select
                options={sourceAgentOptions()}
                current={sourceAgentOptions().find((o) => o.value === store.sourceAgent)}
                onSelect={(o) => o && setStore("sourceAgent", o.value)}
                value={(o) => o.value}
                label={(o) => o.label}
                placeholder="Select an agent..."
                variant="secondary"
                size="small"
                triggerVariant="settings"
              />
            </div>
          </Show>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="large" onClick={() => dialog.close()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="large" disabled={!canSubmit() || store.creating}>
            {store.creating ? "Creating..." : "Create Agent"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
