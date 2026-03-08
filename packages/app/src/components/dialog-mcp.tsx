import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { Switch } from "@opencode-ai/ui/switch"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { useSettingsConfig } from "@/context/settings-config"
import { useLanguage } from "@/context/language"
import { Component, createMemo, Match, Switch as SolidSwitch } from "solid-js"
import { createStore } from "solid-js/store"

export type McpType = "local" | "remote"

export type McpFormState = {
  name: string
  type: McpType
  enabled: boolean
  // Local fields
  command: string
  // Remote fields
  url: string
  oauth: boolean
  clientId: string
  clientSecret: string
  // Submit state
  submitting: boolean
}

export type McpFormErrors = {
  name: string | undefined
  command: string | undefined
  url: string | undefined
  clientId: string | undefined
  clientSecret: string | undefined
}

type HeaderRow = { key: string; value: string }
type EnvRow = { key: string; value: string }

function rows(map?: Record<string, string>) {
  const items = Object.entries(map ?? {}).map(([key, value]) => ({ key, value }))
  return items.length > 0 ? items : [{ key: "", value: "" }]
}

type Props =
  | { mode: "add"; initialName?: undefined; initialConfig?: undefined }
  | { mode: "edit"; initialName: string; initialConfig: McpInput }

export type McpInput =
  | { type: "local"; command: string[]; environment?: Record<string, string>; enabled?: boolean; timeout?: number }
  | {
      type: "remote"
      url: string
      enabled?: boolean
      headers?: Record<string, string>
      oauth?: { clientId?: string; clientSecret?: string; scope?: string } | false
      timeout?: number
    }

function parseInitialConfig(config: McpInput): Partial<McpFormState> {
  if (config.type === "local") {
    return {
      type: "local",
      command: config.command.join(" "),
      enabled: config.enabled ?? true,
    }
  }
  const oauth = config.oauth
  const hasOAuth = oauth !== undefined && oauth !== false
  return {
    type: "remote",
    url: config.url,
    enabled: config.enabled ?? true,
    oauth: hasOAuth,
    clientId: hasOAuth && typeof oauth === "object" ? (oauth.clientId ?? "") : "",
    clientSecret: hasOAuth && typeof oauth === "object" ? (oauth.clientSecret ?? "") : "",
  }
}

function buildConfig(
  form: McpFormState,
  headers: HeaderRow[],
  env: EnvRow[],
  initial?: McpInput,
): McpInput | undefined {
  const enabled = form.enabled
  if (form.type === "local") {
    const cmd = form.command.trim()
    if (!cmd) return
    const command = initial?.type === "local" && cmd === initial.command.join(" ") ? initial.command : cmd.split(/\s+/)
    const environment = Object.fromEntries(env.map((e) => [e.key.trim(), e.value.trim()]).filter(([k]) => k))
    const result: McpInput = { type: "local", command, enabled }
    if (Object.keys(environment).length) result.environment = environment
    if (initial?.timeout !== undefined) result.timeout = initial.timeout
    return result
  }
  const url = form.url.trim()
  if (!url) return
  const result: McpInput = { type: "remote", url, enabled }
  if (initial?.timeout !== undefined) result.timeout = initial.timeout
  const headerMap = Object.fromEntries(headers.map((h) => [h.key.trim(), h.value.trim()]).filter(([k]) => k))
  if (Object.keys(headerMap).length) result.headers = headerMap
  if (form.oauth) {
    const oauth =
      initial?.type === "remote" && initial.oauth && typeof initial.oauth === "object" ? { ...initial.oauth } : {}
    if (form.clientId.trim()) oauth.clientId = form.clientId.trim()
    else delete oauth.clientId
    if (form.clientSecret.trim()) oauth.clientSecret = form.clientSecret.trim()
    else delete oauth.clientSecret
    result.oauth = oauth
  } else {
    result.oauth = false
  }
  return result
}

function validate(
  form: McpFormState,
  t: (key: string) => string,
  existingNames: string[],
  isEdit: boolean,
): McpFormErrors {
  const errors: McpFormErrors = {
    name: undefined,
    command: undefined,
    url: undefined,
    clientId: undefined,
    clientSecret: undefined,
  }
  const name = form.name.trim()
  if (!name) {
    errors.name = t("mcp.error.name.required")
  } else if (!isEdit && existingNames.includes(name)) {
    errors.name = t("mcp.error.name.exists")
  }
  if (form.type === "local") {
    if (!form.command.trim()) errors.command = t("mcp.error.command.required")
  } else {
    if (!form.url.trim()) {
      errors.url = t("mcp.error.url.required")
    } else if (!URL.canParse(form.url.trim())) {
      errors.url = t("mcp.error.url.invalid")
    }
  }
  return errors
}

function isValid(errors: McpFormErrors) {
  return !errors.name && !errors.command && !errors.url && !errors.clientId && !errors.clientSecret
}

export const DialogMcp: Component<Props> = (props) => {
  const dialog = useDialog()
  const settings = useSettingsConfig()
  const lang = useLanguage()

  const isEdit = props.mode === "edit"
  const initial = isEdit && props.initialConfig ? parseInitialConfig(props.initialConfig) : {}
  const initialHeaders = isEdit && props.initialConfig?.type === "remote" ? rows(props.initialConfig.headers) : rows()
  const initialEnv = isEdit && props.initialConfig?.type === "local" ? rows(props.initialConfig.environment) : rows()

  const [form, setForm] = createStore<McpFormState>({
    name: props.initialName ?? "",
    type: initial.type ?? "local",
    enabled: initial.enabled ?? true,
    command: initial.command ?? "",
    url: initial.url ?? "",
    oauth: initial.oauth ?? false,
    clientId: initial.clientId ?? "",
    clientSecret: initial.clientSecret ?? "",
    submitting: false,
  })

  const [headers, setHeaders] = createStore<HeaderRow[]>(initialHeaders)
  const [env, setEnv] = createStore<EnvRow[]>(initialEnv)

  const [errors, setErrors] = createStore<McpFormErrors>({
    name: undefined,
    command: undefined,
    url: undefined,
    clientId: undefined,
    clientSecret: undefined,
  })

  const existingNames = createMemo(() => settings.mcp.map((m) => m.name))

  const title = () => (isEdit ? lang.t("mcp.edit.title") : lang.t("mcp.add.title"))
  const submitLabel = () =>
    form.submitting ? lang.t("common.saving") : isEdit ? lang.t("common.save") : lang.t("common.add")

  const addHeader = () => setHeaders((v) => [...v, { key: "", value: "" }])
  const removeHeader = (i: number) => {
    if (headers.length <= 1) return
    setHeaders((v) => v.filter((_, idx) => idx !== i))
  }
  const addEnv = () => setEnv((v) => [...v, { key: "", value: "" }])
  const removeEnv = (i: number) => {
    if (env.length <= 1) return
    setEnv((v) => v.filter((_, idx) => idx !== i))
  }

  const submit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (form.submitting) return

    const errs = validate(form, lang.t, existingNames(), isEdit)
    setErrors(errs)
    if (!isValid(errs)) return

    const config = buildConfig(form, headers, env, props.initialConfig)
    if (!config) return

    setForm("submitting", true)
    const name = form.name.trim()

    try {
      if (isEdit) {
        await settings.mcpOps.update(name, config)
        showToast({ variant: "success", icon: "circle-check", title: lang.t("mcp.edit.success", { name }) })
      } else {
        await settings.mcpOps.create(name, config)
        showToast({ variant: "success", icon: "circle-check", title: lang.t("mcp.add.success", { name }) })
      }
      dialog.close()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: msg })
    } finally {
      setForm("submitting", false)
    }
  }

  return (
    <Dialog title={title()} transition>
      <form onSubmit={submit} class="flex flex-col gap-6 px-2.5 pb-6 max-h-[60vh] overflow-y-auto">
        {/* Name */}
        <TextField
          data-action="mcp-field-name"
          autofocus={!isEdit}
          disabled={isEdit}
          label={lang.t("mcp.field.name.label")}
          placeholder={lang.t("mcp.field.name.placeholder")}
          value={form.name}
          onChange={(v) => setForm("name", v)}
          validationState={errors.name ? "invalid" : undefined}
          error={errors.name}
        />

        {/* Type */}
        <div class="flex flex-col gap-2">
          <span class="text-12-medium text-text-weak">{lang.t("mcp.field.type.label")}</span>
          <RadioGroup
            data-action="mcp-field-type"
            value={(x) => x.value}
            label={(x) => x.label}
            current={{
              value: form.type,
              label: form.type === "local" ? lang.t("mcp.type.local") : lang.t("mcp.type.remote"),
            }}
            onSelect={(v) => v && setForm("type", v.value as McpType)}
            options={[
              { value: "local" as const, label: lang.t("mcp.type.local") },
              { value: "remote" as const, label: lang.t("mcp.type.remote") },
            ]}
          />
        </div>

        {/* Enabled */}
        <div class="flex items-center justify-between">
          <span class="text-14-regular text-text-base">{lang.t("mcp.field.enabled.label")}</span>
          <Switch data-action="mcp-field-enabled" checked={form.enabled} onChange={(v) => setForm("enabled", v)} />
        </div>

        <SolidSwitch>
          {/* Local fields */}
          <Match when={form.type === "local"}>
            <TextField
              data-action="mcp-field-command"
              label={lang.t("mcp.field.command.label")}
              placeholder={lang.t("mcp.field.command.placeholder")}
              value={form.command}
              onChange={(v) => setForm("command", v)}
              validationState={errors.command ? "invalid" : undefined}
              error={errors.command}
            />
            <div class="flex flex-col gap-3">
              <span class="text-12-medium text-text-weak">{lang.t("mcp.field.env.label")}</span>
              {env.map((e, i) => (
                <div class="flex gap-2 items-start">
                  <div class="flex-1">
                    <TextField
                      hideLabel
                      placeholder={lang.t("mcp.field.env.key.placeholder")}
                      value={e.key}
                      onChange={(v) => setEnv(i, "key", v)}
                    />
                  </div>
                  <div class="flex-1">
                    <TextField
                      hideLabel
                      placeholder={lang.t("mcp.field.env.value.placeholder")}
                      value={e.value}
                      onChange={(v) => setEnv(i, "value", v)}
                    />
                  </div>
                  <IconButton
                    type="button"
                    icon="trash"
                    variant="ghost"
                    class="mt-1.5"
                    onClick={() => removeEnv(i)}
                    disabled={env.length <= 1}
                    aria-label={lang.t("mcp.field.env.remove")}
                  />
                </div>
              ))}
              <Button type="button" size="small" variant="ghost" icon="plus-small" onClick={addEnv} class="self-start">
                {lang.t("mcp.field.env.add")}
              </Button>
            </div>
          </Match>

          {/* Remote fields */}
          <Match when={form.type === "remote"}>
            <TextField
              data-action="mcp-field-url"
              label={lang.t("mcp.field.url.label")}
              placeholder={lang.t("mcp.field.url.placeholder")}
              value={form.url}
              onChange={(v) => setForm("url", v)}
              validationState={errors.url ? "invalid" : undefined}
              error={errors.url}
            />

            <div class="flex items-center justify-between">
              <span class="text-14-regular text-text-base">{lang.t("mcp.field.oauth.label")}</span>
              <Switch data-action="mcp-field-oauth" checked={form.oauth} onChange={(v) => setForm("oauth", v)} />
            </div>

            {form.oauth && (
              <div class="flex flex-col gap-4 pl-4 border-l-2 border-border-weak-base">
                <TextField
                  label={lang.t("mcp.field.clientId.label")}
                  placeholder={lang.t("mcp.field.clientId.placeholder")}
                  value={form.clientId}
                  onChange={(v) => setForm("clientId", v)}
                />
                <TextField
                  label={lang.t("mcp.field.clientSecret.label")}
                  placeholder={lang.t("mcp.field.clientSecret.placeholder")}
                  type="password"
                  value={form.clientSecret}
                  onChange={(v) => setForm("clientSecret", v)}
                />
              </div>
            )}

            <div class="flex flex-col gap-3">
              <span class="text-12-medium text-text-weak">{lang.t("mcp.field.headers.label")}</span>
              {headers.map((h, i) => (
                <div class="flex gap-2 items-start">
                  <div class="flex-1">
                    <TextField
                      hideLabel
                      placeholder={lang.t("mcp.field.headers.key.placeholder")}
                      value={h.key}
                      onChange={(v) => setHeaders(i, "key", v)}
                    />
                  </div>
                  <div class="flex-1">
                    <TextField
                      hideLabel
                      placeholder={lang.t("mcp.field.headers.value.placeholder")}
                      value={h.value}
                      onChange={(v) => setHeaders(i, "value", v)}
                    />
                  </div>
                  <IconButton
                    type="button"
                    icon="trash"
                    variant="ghost"
                    class="mt-1.5"
                    onClick={() => removeHeader(i)}
                    disabled={headers.length <= 1}
                    aria-label={lang.t("mcp.field.headers.remove")}
                  />
                </div>
              ))}
              <Button
                type="button"
                size="small"
                variant="ghost"
                icon="plus-small"
                onClick={addHeader}
                class="self-start"
              >
                {lang.t("mcp.field.headers.add")}
              </Button>
            </div>
          </Match>
        </SolidSwitch>

        {/* Actions */}
        <div class="flex gap-3 pt-2">
          <Button data-action="mcp-submit" type="submit" size="large" variant="primary" disabled={form.submitting}>
            {submitLabel()}
          </Button>
          <Button data-action="mcp-cancel" type="button" size="large" variant="secondary" onClick={dialog.close}>
            {lang.t("common.cancel")}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
