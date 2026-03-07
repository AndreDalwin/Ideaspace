import { Component, createSignal, For, onMount, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { AgentList } from "./list"
import { useAgents } from "@/context/agents"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { useModels } from "@/context/models"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { Checkbox } from "@opencode-ai/ui/checkbox"
import { Icon } from "@opencode-ai/ui/icon"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Switch } from "@opencode-ai/ui/switch"
import { showToast } from "@opencode-ai/ui/toast"
import { useLanguage } from "@/context/language"
import { DialogCreateAgent } from "@/components/dialog-create-agent"
import type { Agent, AgentConfig, PermissionRuleConfig } from "@opencode-ai/sdk/v2/client"
import { formatServerError } from "@/utils/server-errors"

type PermissionValue = "allow" | "ask" | "deny"
type PermissionLevel = "allow" | "deny"

interface PermissionState {
  fileRead: PermissionLevel
  fileEdit: PermissionLevel
  filePaths: string
  imageGenerate: PermissionLevel
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

type ModelOption = {
  value: string
  label: string
}

const levelOptions: { value: PermissionLevel; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny" },
]

const valid = new Set<PermissionValue>(["allow", "ask", "deny"])

function level(value: unknown, fallback: PermissionLevel = "deny"): PermissionLevel {
  if (value === "allow") return "allow"
  if (typeof value === "string" && valid.has(value as PermissionValue)) return "deny"
  return fallback
}

function permissionState(rules: Agent["permission"], permission: string) {
  const scoped = rules.filter((rule) => rule.permission === permission)
  const item = new Map<string, PermissionLevel>()
  for (const rule of scoped) {
    if (rule.pattern === "*") continue
    item.set(rule.pattern, level(rule.action))
  }
  return {
    rule: level(scoped.findLast((rule) => rule.pattern === "*")?.action),
    item: Object.fromEntries(item),
  }
}

function allowed(item: Record<string, PermissionLevel>) {
  return Object.entries(item)
    .filter((entry) => entry[1] === "allow")
    .map((entry) => entry[0])
    .join("\n")
}

function list(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item, index, all) => item.length > 0 && all.indexOf(item) === index)
}

function sameMap(a: Record<string, PermissionLevel>, b: Record<string, PermissionLevel>) {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort()
  return keys.every((key) => a[key] === b[key])
}

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
  const sdk = useGlobalSDK()
  const globalSync = useGlobalSync()
  const models = useModels()
  const lang = useLanguage()
  const dialog = useDialog()
  const [selected, setSelected] = createSignal<string | undefined>(undefined)
  const [deleting, setDeleting] = createSignal(false)
  const [resetting, setResetting] = createSignal(false)
  const [expanded, setExpanded] = createSignal(true)
  const [prompt, setPrompt] = createSignal("")
  const [mcps, setMcps] = createSignal<MCP[]>([])
  const [selectedMcps, setSelectedMcps] = createSignal<Set<string>>(new Set())
  const [initialMcps, setInitialMcps] = createSignal<Set<string>>(new Set())
  const [store, setStore] = createStore({
    isEditing: false,
    model: "",
    variant: "",
    steps: "",
    hidden: false,
    taskRule: "deny" as PermissionLevel,
    taskItem: {} as Record<string, PermissionLevel>,
    perms: {
      fileRead: "deny" as PermissionLevel,
      fileEdit: "deny" as PermissionLevel,
      filePaths: "",
      imageGenerate: "deny" as PermissionLevel,
      webfetch: "deny" as PermissionLevel,
      websearch: "deny" as PermissionLevel,
      bash: "deny" as PermissionLevel,
      bashPaths: "",
      other: "deny" as PermissionLevel,
    } satisfies PermissionState,
  })
  const [form, setForm] = createStore<FormState>({
    name: "",
    description: "",
    mode: "primary",
    nameError: undefined,
    isEditing: false,
  })
  const [base, setBase] = createStore({
    name: "",
    description: "",
    mode: "primary" as FormState["mode"],
    prompt: "",
    model: "",
    variant: "",
    steps: "",
    hidden: false,
    taskRule: "deny" as PermissionLevel,
    taskItem: {} as Record<string, PermissionLevel>,
    perms: {
      fileRead: "deny" as PermissionLevel,
      fileEdit: "deny" as PermissionLevel,
      filePaths: "",
      imageGenerate: "deny" as PermissionLevel,
      webfetch: "deny" as PermissionLevel,
      websearch: "deny" as PermissionLevel,
      bash: "deny" as PermissionLevel,
      bashPaths: "",
      other: "deny" as PermissionLevel,
    },
  })
  const [saving, setSaving] = createSignal(false)

  const modelOptions = () => {
    const list = models
      .list()
      .map((item) => ({
        value: `${item.provider.id}/${item.id}`,
        label: `${item.provider.name} / ${item.name}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    if (!store.model) return [{ value: "", label: "Use global default model" }, ...list]
    if (list.some((item) => item.value === store.model))
      return [{ value: "", label: "Use global default model" }, ...list]
    return [
      { value: "", label: "Use global default model" },
      { value: store.model, label: `${store.model} (configured)` },
      ...list,
    ]
  }

  const selectedModel = () => {
    if (!store.model) return undefined
    const [providerID, ...rest] = store.model.split("/")
    const modelID = rest.join("/")
    if (!providerID || !modelID) return undefined
    return models.list().find((item) => item.provider.id === providerID && item.id === modelID)
  }

  const variantOptions = () => {
    const item = selectedModel()
    if (!item?.variants) return [] as ModelOption[]
    return Object.keys(item.variants)
      .sort()
      .map((value) => ({ value, label: value }))
  }

  const subagents = () => agents.subagents.filter((item) => item.name !== selected())

  const agent = () => {
    const name = selected()
    if (!name) return undefined
    return agents.get(name)
  }

  onMount(async () => {
    const result = await sdk.client.mcp.status()
    if (result.data) {
      const mcpList: MCP[] = Object.entries(result.data).flatMap(([name, info]) => {
        if (!info || typeof info !== "object") return []
        const status = "status" in info && typeof info.status === "string" ? info.status : "unknown"
        const type = "type" in info && info.type === "remote" ? "remote" : "local"
        return [{ name, status, type }]
      })
      setMcps(mcpList)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    onCleanup(() => window.removeEventListener("beforeunload", handleBeforeUnload))
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
  }

  const handleModeChange = (option: { value: string; label: string } | undefined) => {
    const a = agent()
    if (!a || !option) return

    const mode = option.value as "primary" | "subagent" | "all"
    setForm("mode", mode)
    setForm("isEditing", true)
    if (mode !== "subagent") setStore("hidden", false)
  }

  const handleModelChange = (option: ModelOption | undefined) => {
    setStore("model", option?.value ?? "")
    if (!option?.value) {
      setStore("variant", "")
      setStore("isEditing", true)
      return
    }

    const next = models.list().find((item) => `${item.provider.id}/${item.id}` === option.value)
    if (!next?.variants || !Object.keys(next.variants).includes(store.variant)) setStore("variant", "")
    setStore("isEditing", true)
  }

  const handleVariantChange = (option: ModelOption | undefined) => {
    setStore("variant", option?.value ?? "")
    setStore("isEditing", true)
  }

  const handleStepsChange = (value: string) => {
    setStore("steps", value)
    setStore("isEditing", true)
  }

  const handleTaskRuleChange = (option: { value: PermissionLevel; label: string } | undefined) => {
    if (!option) return
    setStore("taskRule", option.value)
    setStore("isEditing", true)
  }

  const handleTaskItemChange = (name: string, value: PermissionLevel) => {
    setStore("taskItem", name, value)
    setStore("isEditing", true)
  }

  const loadAgentData = (a: Agent) => {
    const cfg = agents.getConfig(a.name)
    const mcp = Array.isArray(cfg?.mcps) ? cfg.mcps.filter((item): item is string => typeof item === "string") : []
    const read = permissionState(a.permission, "read")
    const edit = permissionState(a.permission, "edit")
    const imageGenerate = permissionState(a.permission, "image_generate")
    const webfetch = permissionState(a.permission, "webfetch")
    const websearch = permissionState(a.permission, "websearch")
    const bash = permissionState(a.permission, "bash")
    const other = permissionState(a.permission, "other")
    const task = permissionState(a.permission, "task")
    const next = {
      name: a.name,
      description: a.description ?? "",
      mode: a.mode ?? "primary",
      prompt: cfg?.prompt ?? a.prompt ?? "",
      model: cfg?.model ?? (a.model ? `${a.model.providerID}/${a.model.modelID}` : ""),
      variant: cfg?.variant ?? a.variant ?? "",
      steps: cfg?.steps?.toString() ?? a.steps?.toString() ?? "",
      hidden: (cfg?.hidden ?? a.hidden) === true,
      taskRule: task.rule,
      taskItem: task.item,
      perms: {
        fileRead: read.rule,
        fileEdit: edit.rule,
        filePaths: allowed(edit.item),
        imageGenerate: imageGenerate.rule,
        webfetch: webfetch.rule,
        websearch: websearch.rule,
        bash: bash.rule,
        bashPaths: allowed(bash.item),
        other: other.rule,
      },
    }

    setForm({
      name: next.name,
      description: next.description,
      mode: next.mode,
      nameError: undefined,
      isEditing: false,
    })

    setPrompt(next.prompt)

    setStore("model", next.model)
    setStore("variant", next.variant)
    setStore("steps", next.steps)
    setStore("hidden", next.hidden)
    setStore("taskRule", next.taskRule)
    setStore("taskItem", next.taskItem)

    setStore("perms", {
      fileRead: next.perms.fileRead,
      fileEdit: next.perms.fileEdit,
      filePaths: next.perms.filePaths,
      imageGenerate: next.perms.imageGenerate,
      webfetch: next.perms.webfetch,
      websearch: next.perms.websearch,
      bash: next.perms.bash,
      bashPaths: next.perms.bashPaths,
      other: next.perms.other,
    })
    setBase(next)

    const selectedMcps = new Set<string>(mcp)
    setSelectedMcps(selectedMcps)
    setInitialMcps(new Set(selectedMcps))
    setStore("isEditing", false)
  }

  const handleSelect = (a: Agent) => {
    if (a.name === selected()) return
    if (!confirmNavigate()) return
    setSelected(a.name)
    loadAgentData(a)
  }

  const handleSave = async () => {
    const a = agent()
    if (!a) return

    if (form.nameError) {
      showToast({
        title: lang.t("common.requestFailed"),
        description: form.nameError,
      })
      return
    }

    const rawSteps = store.steps.trim()
    const steps = rawSteps ? Number(rawSteps) : undefined
    if (rawSteps && (!Number.isInteger(steps) || (steps ?? 0) <= 0)) {
      showToast({
        title: lang.t("common.requestFailed"),
        description: "Steps must be a positive whole number",
      })
      return
    }

    setSaving(true)

    try {
      const cfg: Partial<AgentConfig> = {}

      if (form.description !== base.description) cfg.description = form.description
      if (form.mode !== base.mode) cfg.mode = form.mode
      if (prompt() !== base.prompt) cfg.prompt = prompt()
      if (store.model !== base.model) cfg.model = store.model || undefined
      if (store.variant !== base.variant) cfg.variant = store.variant || undefined
      if (store.steps !== base.steps) cfg.steps = steps
      if (form.mode === "subagent" && store.hidden !== base.hidden) cfg.hidden = store.hidden
      if (form.mode !== "subagent" && base.hidden) cfg.hidden = undefined

      if (selectedMcps().size !== initialMcps().size || ![...selectedMcps()].every((item) => initialMcps().has(item))) {
        cfg.mcps = Array.from(selectedMcps())
      }

      const task = Object.fromEntries(
        subagents().flatMap((item) => {
          const value = store.taskItem[item.name] ?? store.taskRule
          if (value === store.taskRule) return []
          return [[item.name, value] as const]
        }),
      )

      const pack = (rule: PermissionLevel, paths: string) => {
        const items = Object.fromEntries(list(paths).map((item) => [item, "allow"] as const))
        if (Object.keys(items).length === 0) return rule
        return { "*": rule, ...items }
      }

      const rawPermission = globalSync.data.config.agent?.[a.name]?.permission
      const nextPermission =
        rawPermission && typeof rawPermission === "object" && !Array.isArray(rawPermission) ? { ...rawPermission } : {}

      const setPermission = (key: string, value: PermissionRuleConfig | undefined) => {
        if (value === undefined) {
          delete nextPermission[key]
          return
        }
        nextPermission[key] = value
      }

      if (store.perms.fileRead !== base.perms.fileRead) setPermission("read", store.perms.fileRead)
      if (store.perms.fileEdit !== base.perms.fileEdit || store.perms.filePaths !== base.perms.filePaths) {
        setPermission("edit", pack(store.perms.fileEdit, store.perms.filePaths))
      }
      if (store.perms.imageGenerate !== base.perms.imageGenerate) {
        setPermission("image_generate", store.perms.imageGenerate)
      }
      if (store.perms.webfetch !== base.perms.webfetch) setPermission("webfetch", store.perms.webfetch)
      if (store.perms.websearch !== base.perms.websearch) setPermission("websearch", store.perms.websearch)
      if (store.perms.bash !== base.perms.bash || store.perms.bashPaths !== base.perms.bashPaths) {
        setPermission("bash", pack(store.perms.bash, store.perms.bashPaths))
      }
      if (store.perms.other !== base.perms.other) setPermission("other", store.perms.other)
      if (store.taskRule !== base.taskRule || !sameMap(store.taskItem, base.taskItem)) {
        const value = Object.keys(task).length === 0 ? store.taskRule : { "*": store.taskRule, ...task }
        setPermission("task", value)
      }

      if (Object.keys(nextPermission).length > 0) cfg.permission = nextPermission
      if (globalSync.data.config.agent?.[a.name]?.permission && Object.keys(nextPermission).length === 0)
        cfg.permission = undefined

      const current = globalSync.data.config.agent?.[a.name] ?? {}
      const next = { ...(globalSync.data.config.agent ?? {}) }
      if (form.name !== a.name) delete next[a.name]
      next[form.name] = { ...current, ...cfg }

      const defaultAgent =
        globalSync.data.config.default_agent !== a.name
          ? globalSync.data.config.default_agent
          : form.mode === "subagent"
            ? undefined
            : form.name

      await globalSync.updateConfig({
        ...globalSync.data.config,
        default_agent: defaultAgent,
        agent: next,
      })
      await agents.reload()
      setSelected(form.name)
      const refreshed = agents.get(form.name)
      if (refreshed) loadAgentData(refreshed)

      setForm("isEditing", false)
      setStore("isEditing", false)
      setInitialMcps(new Set(selectedMcps()))

      showToast({
        title: lang.t("common.save"),
        description: "Agent saved successfully",
      })
    } catch (err) {
      showToast({
        title: lang.t("common.requestFailed"),
        description: formatServerError(err, lang.t),
      })
    } finally {
      setSaving(false)
    }
  }

  const isDirty = () =>
    form.isEditing ||
    store.isEditing ||
    selectedMcps().size !== initialMcps().size ||
    ![...selectedMcps()].every((m) => initialMcps().has(m))

  const confirmNavigate = () => {
    if (!isDirty()) return true
    return window.confirm("You have unsaved changes. Are you sure you want to leave?")
  }

  const handleCreate = () => {
    dialog.show(() => (
      <DialogCreateAgent
        onCreate={(name) => {
          setSelected(name)
          agents.reload().then(() => {
            const a = agents.get(name)
            if (a) loadAgentData(a)
          })
        }}
      />
    ))
  }

  const handleDelete = () => {
    const a = agent()
    if (!a || a.native) return

    dialog.show(() => (
      <Dialog
        title="Delete Agent"
        description={`Are you sure you want to delete "${a.name}"? This action cannot be undone.`}
        action={
          <div class="flex items-center gap-2">
            <Button size="small" variant="ghost" onClick={() => dialog.close()}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="primary"
              class="bg-danger-base hover:bg-danger-strong"
              disabled={deleting()}
              onClick={async () => {
                setDeleting(true)
                try {
                  await agents.remove(a.name)
                  setSelected(undefined)
                  dialog.close()
                  showToast({
                    title: lang.t("common.success"),
                    description: "Agent deleted successfully",
                  })
                } catch (err) {
                  showToast({
                    title: lang.t("common.requestFailed"),
                    description: formatServerError(err, lang.t),
                  })
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting() ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />
    ))
  }

  const handleReset = () => {
    const a = agent()
    if (!a || !a.native) return

    dialog.show(() => (
      <Dialog
        title="Reset to Defaults"
        description={`Reset "${a.name}" to system defaults? This will remove all custom configuration.`}
        action={
          <div class="flex items-center gap-2">
            <Button size="small" variant="ghost" onClick={() => dialog.close()}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="primary"
              disabled={resetting()}
              onClick={async () => {
                setResetting(true)
                try {
                  await agents.remove(a.name)
                  await agents.reload()
                  const refreshed = agents.get(a.name)
                  if (refreshed) loadAgentData(refreshed)
                  dialog.close()
                  showToast({
                    title: lang.t("common.success"),
                    description: "Agent reset to defaults",
                  })
                } catch (err) {
                  showToast({
                    title: lang.t("common.requestFailed"),
                    description: formatServerError(err, lang.t),
                  })
                } finally {
                  setResetting(false)
                }
              }}
            >
              {resetting() ? "Resetting..." : "Reset"}
            </Button>
          </div>
        }
      />
    ))
  }

  return (
    <div class="flex h-full w-full flex-col lg:flex-row">
      {/* Left pane - Agent List */}
      <div class="flex h-full w-full flex-col border-r border-border-weak-base lg:w-80 xl:w-96">
        <div class="flex items-center justify-between border-b border-border-weak-base px-4 py-3">
          <h2 class="text-16-semibold text-text-strong">Agents</h2>
          <Button size="small" variant="secondary" onClick={handleCreate}>
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
                    <Button size="small" variant="ghost" onClick={handleReset}>
                      Reset
                    </Button>
                  </Show>
                  <Show when={!a().native}>
                    <Button size="small" variant="ghost" class="text-danger-base" onClick={handleDelete}>
                      <Icon name="trash" size="small" />
                      Delete
                    </Button>
                  </Show>
                  <Button size="small" variant="primary" disabled={!isDirty() || saving()} onClick={handleSave}>
                    <Icon name="check" size="small" />
                    Save
                    <Show when={isDirty()}>
                      <span class="ml-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                    </Show>
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
                      <Show when={form.mode === "subagent"}>
                        <div class="flex items-center justify-between rounded-md border border-border-weak-base bg-surface-base px-3 py-2">
                          <div>
                            <div class="text-13-medium text-text-strong">Show in subagent picker</div>
                            <div class="text-12-regular text-text-weak">
                              Hidden subagents still work, but they won’t appear in autocomplete or quick-pick lists
                            </div>
                          </div>
                          <Switch
                            checked={!store.hidden}
                            onChange={(checked) => {
                              setStore("hidden", !checked)
                              setStore("isEditing", true)
                            }}
                          />
                        </div>
                      </Show>
                    </div>
                  </section>

                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Model</h3>
                    <div class="space-y-4 rounded-lg bg-surface-raised-base p-4">
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Model</span>
                        <Select
                          options={modelOptions()}
                          current={modelOptions().find((item) => item.value === store.model)}
                          onSelect={handleModelChange}
                          value={(item) => item.value}
                          label={(item) => item.label}
                          variant="secondary"
                          size="small"
                          triggerVariant="settings"
                        />
                        <p class="mt-2 text-12-regular text-text-weak">
                          Leave this unset to inherit the workspace default model.
                        </p>
                      </div>
                      <Show when={variantOptions().length > 0}>
                        <div>
                          <span class="mb-1.5 block text-13-medium text-text-strong">Variant</span>
                          <Select
                            options={[{ value: "", label: "Use model default variant" }, ...variantOptions()]}
                            current={[{ value: "", label: "Use model default variant" }, ...variantOptions()].find(
                              (item) => item.value === store.variant,
                            )}
                            onSelect={handleVariantChange}
                            value={(item) => item.value}
                            label={(item) => item.label}
                            variant="secondary"
                            size="small"
                            triggerVariant="settings"
                          />
                        </div>
                      </Show>
                      <div class="grid gap-4 md:grid-cols-1">
                        <label class="block">
                          <span class="mb-1.5 block text-13-medium text-text-strong">Max steps</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={store.steps}
                            onInput={(event) => handleStepsChange(event.currentTarget.value)}
                            placeholder="Use runtime default"
                            class="h-10 w-full rounded-md border border-border-weak-base bg-surface-base px-3 text-13-regular text-text-strong placeholder:text-text-weak focus:border-accent-base focus:outline-none"
                          />
                          <span class="mt-1 block text-12-regular text-text-weak">
                            Caps how many agentic iterations run before falling back to text-only output.
                          </span>
                        </label>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 class="mb-4 text-14-medium text-text-strong">Subagent Access</h3>
                    <div class="space-y-4 rounded-lg bg-surface-raised-base p-4">
                      <div>
                        <span class="mb-1.5 block text-13-medium text-text-strong">Default access</span>
                        <p class="mb-3 text-12-regular text-text-weak">
                          These rules control which subagents this agent can launch through the task tool.
                        </p>
                        <RadioGroup
                          options={levelOptions}
                          current={levelOptions.find((item) => item.value === store.taskRule)}
                          value={(item) => item.value}
                          label={(item) => item.label}
                          onSelect={handleTaskRuleChange}
                          size="small"
                        />
                      </div>
                      <Show
                        when={subagents().length > 0}
                        fallback={
                          <div class="text-13-regular text-text-weak">No subagents are currently available.</div>
                        }
                      >
                        <div class="space-y-4 border-t border-border-weak-base pt-4">
                          <For each={subagents()}>
                            {(item) => (
                              <PermissionRow
                                label={item.name}
                                desc={
                                  item.description ?? "Control whether this agent can delegate work to this subagent"
                                }
                                level={store.taskItem[item.name] ?? store.taskRule}
                                onChange={(value) => handleTaskItemChange(item.name, value)}
                              />
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </section>

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
                            onChange={(v) => {
                              setStore("perms", "fileRead", v)
                              setStore("isEditing", true)
                            }}
                          />
                          <PermissionRow
                            label="Edit files"
                            desc="Modify and write file contents"
                            level={store.perms.fileEdit}
                            onChange={(v) => {
                              setStore("perms", "fileEdit", v)
                              setStore("isEditing", true)
                            }}
                          >
                            <TextField
                              label="Allowed paths"
                              multiline
                              value={store.perms.filePaths}
                              onChange={(v) => {
                                setStore("perms", "filePaths", v)
                                setStore("isEditing", true)
                              }}
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
                            onChange={(v) => {
                              setStore("perms", "webfetch", v)
                              setStore("isEditing", true)
                            }}
                          />
                          <PermissionRow
                            label="Web search"
                            desc="Search the internet for information"
                            level={store.perms.websearch}
                            onChange={(v) => {
                              setStore("perms", "websearch", v)
                              setStore("isEditing", true)
                            }}
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
                            label="Image generation"
                            desc="Generate images with the configured image model"
                            level={store.perms.imageGenerate}
                            onChange={(v) => {
                              setStore("perms", "imageGenerate", v)
                              setStore("isEditing", true)
                            }}
                          />
                          <PermissionRow
                            label="Bash execution"
                            desc="Run shell commands and scripts"
                            level={store.perms.bash}
                            onChange={(v) => {
                              setStore("perms", "bash", v)
                              setStore("isEditing", true)
                            }}
                          >
                            <TextField
                              label="Allowed paths"
                              multiline
                              value={store.perms.bashPaths}
                              onChange={(v) => {
                                setStore("perms", "bashPaths", v)
                                setStore("isEditing", true)
                              }}
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
                            onChange={(v) => {
                              setStore("perms", "other", v)
                              setStore("isEditing", true)
                            }}
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
