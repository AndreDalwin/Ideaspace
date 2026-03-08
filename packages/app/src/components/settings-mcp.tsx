import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Tag } from "@opencode-ai/ui/tag"
import { showToast } from "@opencode-ai/ui/toast"
import { useSettingsConfig } from "@/context/settings-config"
import { useGlobalSDK } from "@/context/global-sdk"
import { useLanguage } from "@/context/language"
import { Component, createMemo, createSignal, For, Show } from "solid-js"
import { DialogMcp, type McpInput } from "./dialog-mcp"

function DialogDeleteMcp(props: { name: string; onDelete: () => Promise<void> }) {
  const dialog = useDialog()
  const lang = useLanguage()
  const [deleting, setDeleting] = createSignal(false)

  const handleDelete = async () => {
    setDeleting(true)
    await props.onDelete()
    dialog.close()
  }

  return (
    <Dialog title={lang.t("mcp.delete.title")} fit>
      <div class="flex flex-col gap-4 pl-6 pr-2.5 pb-3">
        <span class="text-14-regular text-text-strong">{lang.t("mcp.delete.confirm", { name: props.name })}</span>
        <div class="flex justify-end gap-2">
          <Button variant="ghost" size="large" onClick={() => dialog.close()} disabled={deleting()}>
            {lang.t("common.cancel")}
          </Button>
          <Button variant="primary" size="large" onClick={handleDelete} disabled={deleting()}>
            {lang.t("mcp.delete.button")}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export const SettingsMcp: Component = () => {
  const lang = useLanguage()
  const settings = useSettingsConfig()
  const sdk = useGlobalSDK()
  const dialog = useDialog()
  const [optimistic, setOptimistic] = createSignal<Record<string, { status?: string; enabled?: boolean }>>({})

  const mcpList = createMemo(() => {
    const list = settings.mcp
    return list.map((item) => {
      const opt = optimistic()[item.name]
      const currentStatus = opt?.status ?? item.status?.status ?? "disabled"
      return {
        ...item,
        status: opt?.status ? { status: opt.status } : item.status,
        enabled: opt?.enabled ?? currentStatus === "connected",
      }
    })
  })

  const connectedCount = createMemo(() => mcpList().filter((m) => m.status?.status === "connected").length)

  const configType = (config: { type?: string; enabled?: boolean }) => {
    if (config.type === "local") return lang.t("mcp.type.local")
    if (config.type === "remote") return lang.t("mcp.type.remote")
    return lang.t("settings.mcp.tag.unknown")
  }

  const statusLabel = (status: string | undefined) => {
    if (!status) return lang.t("mcp.status.disabled")
    const key = `mcp.status.${status}` as const
    return lang.t(key) || status
  }

  const rollback = (name: string) => {
    setOptimistic((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const setOptimisticStatus = (name: string, status: string) => {
    setOptimistic((prev) => ({ ...prev, [name]: { ...prev[name], status } }))
  }

  const connect = async (name: string) => {
    setOptimisticStatus(name, "connected")

    try {
      await sdk.client.mcp.connect({ name }, { throwOnError: true })
      await settings.reload()
      rollback(name)
      showToast({
        variant: "success",
        icon: "circle-check",
        title: lang.t("mcp.connect.success", { name }),
      })
    } catch (err) {
      rollback(name)
      const msg = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: msg })
    }
  }

  const disconnect = async (name: string) => {
    setOptimisticStatus(name, "disabled")

    try {
      await sdk.client.mcp.disconnect({ name }, { throwOnError: true })
      await settings.reload()
      rollback(name)
      showToast({
        variant: "success",
        icon: "circle-check",
        title: lang.t("mcp.disconnect.success", { name }),
      })
    } catch (err) {
      rollback(name)
      const msg = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: msg })
    }
  }

  const authenticate = async (name: string) => {
    try {
      await sdk.client.mcp.auth.authenticate({ name }, { throwOnError: true })
      await settings.reload()
      showToast({
        variant: "success",
        icon: "circle-check",
        title: lang.t("mcp.auth.success", { name }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: msg })
    }
  }

  const performRemove = async (name: string) => {
    try {
      await settings.mcpOps.remove(name)
      showToast({
        variant: "success",
        icon: "circle-check",
        title: lang.t("mcp.delete.success", { name }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: msg })
      throw err
    }
  }

  const confirmRemove = (name: string) => {
    dialog.show(() => <DialogDeleteMcp name={name} onDelete={() => performRemove(name)} />)
  }

  const openAddDialog = () => {
    dialog.show(() => <DialogMcp mode="add" />)
  }

  const openEditDialog = (name: string, config: McpInput) => {
    dialog.show(() => <DialogMcp mode="edit" initialName={name} initialConfig={config} />)
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex items-center justify-between pt-6 pb-8 max-w-[720px]">
          <div class="flex flex-col gap-1">
            <h2 class="text-16-medium text-text-strong">{lang.t("settings.mcp.title")}</h2>
            <p class="text-13-regular text-text-secondary">{lang.t("settings.mcp.description")}</p>
          </div>
          <Button size="large" variant="primary" icon="plus-small" onClick={openAddDialog} data-action="mcp-add">
            {lang.t("common.add")}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        <Show
          when={mcpList().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div class="size-12 rounded-full bg-surface-raised-base flex items-center justify-center">
                <Icon name="mcp" class="size-6 text-text-weaker" />
              </div>
              <div class="flex flex-col gap-1">
                <p class="text-14-medium text-text-strong">{lang.t("settings.mcp.empty.title")}</p>
                <p class="text-13-regular text-text-secondary">{lang.t("settings.mcp.empty.description")}</p>
              </div>
              <Button variant="secondary" icon="plus-small" onClick={openAddDialog}>
                {lang.t("common.add")}
              </Button>
            </div>
          }
        >
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between pb-2">
              <h3 class="text-14-medium text-text-strong">{lang.t("settings.mcp.section.configured")}</h3>
              <span class="text-12-regular text-text-weaker">
                {connectedCount()} {lang.t("settings.mcp.connected.of")} {mcpList().length}{" "}
                {lang.t("settings.mcp.connected.label")}
              </span>
            </div>
            <div class="bg-surface-raised-base px-4 rounded-lg">
              <For each={mcpList()}>
                {(item) => {
                  const status = () => item.status?.status ?? "disabled"
                  const isConnected = () => status() === "connected"
                  const isFailed = () => status() === "failed"
                  const needsAuth = () => status() === "needs_auth" || status() === "needs_client_registration"
                  const isPending = () =>
                    settings.pendingFor(`mcp:connect:${item.name}`) ||
                    settings.pendingFor(`mcp:disconnect:${item.name}`)

                  return (
                    <div
                      class="group flex flex-wrap items-center justify-between gap-4 min-h-16 py-3 border-b border-border-weak-base last:border-none"
                      data-selector={`mcp-row-${item.name}`}
                    >
                      <div class="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          classList={{
                            "size-2 rounded-full shrink-0": true,
                            "bg-icon-success-base": isConnected(),
                            "bg-icon-critical-base": isFailed(),
                            "bg-icon-warning-base": needsAuth(),
                            "bg-text-weaker": status() === "disabled",
                          }}
                        />
                        <div class="flex flex-col min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="text-14-medium text-text-strong truncate">{item.name}</span>
                            <Tag data-selector={`mcp-source-${item.name}`}>{lang.t("settings.mcp.tag.global")}</Tag>
                            <Tag>{configType(item.config)}</Tag>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-12-regular text-text-weaker">{statusLabel(status())}</span>
                            <Show when={item.status?.status === "failed" && (item.status as { error?: string }).error}>
                              <span class="text-12-regular text-icon-critical-base truncate">
                                {(item.status as { error?: string }).error}
                              </span>
                            </Show>
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-1">
                        <Show when={needsAuth()}>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => authenticate(item.name)}
                            disabled={isPending()}
                            data-selector={`mcp-auth-${item.name}`}
                          >
                            {lang.t("common.authenticate")}
                          </Button>
                        </Show>

                        <Show
                          when={isConnected()}
                          fallback={
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => connect(item.name)}
                              disabled={isPending()}
                              data-selector={`mcp-connect-${item.name}`}
                            >
                              {lang.t("common.connect")}
                            </Button>
                          }
                        >
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => disconnect(item.name)}
                            disabled={isPending()}
                            data-selector={`mcp-disconnect-${item.name}`}
                          >
                            {lang.t("common.disconnect")}
                          </Button>
                        </Show>

                        <IconButton
                          icon="edit"
                          variant="ghost"
                          size="small"
                          onClick={() => openEditDialog(item.name, item.config as McpInput)}
                          aria-label={lang.t("common.edit")}
                          data-selector={`mcp-edit-${item.name}`}
                        />

                        <IconButton
                          icon="trash"
                          variant="ghost"
                          size="small"
                          onClick={() => confirmRemove(item.name)}
                          aria-label={lang.t("common.delete")}
                          data-selector={`mcp-delete-${item.name}`}
                        />
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
