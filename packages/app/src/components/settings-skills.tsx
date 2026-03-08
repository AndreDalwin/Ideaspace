import { Button } from "@opencode-ai/ui/button"
import { Tag } from "@opencode-ai/ui/tag"
import { showToast } from "@opencode-ai/ui/toast"
import { useGlobalSync } from "@/context/global-sync"
import { usePlatform } from "@/context/platform"
import { useSettingsConfig } from "@/context/settings-config"
import { useLanguage } from "@/context/language"
import { classifySkillOrigin, type SkillOrigin } from "./settings-skills-origin"
import { type Component, For, Show, createMemo } from "solid-js"
import { createStore } from "solid-js/store"

type SkillItem = {
  name: string
  description: string
  location: string
  content: string
}

function originLabel(origin: SkillOrigin, t: (key: string) => string) {
  if (origin === "managed-global") return t("settings.skills.origin.managed")
  if (origin === "inherited-external") return t("settings.skills.origin.external")
  return t("settings.skills.origin.cache")
}

export const SettingsSkills: Component = () => {
  const lang = useLanguage()
  const platform = usePlatform()
  const sync = useGlobalSync()
  const cfg = useSettingsConfig()

  function classifyOrigin(location: string): SkillOrigin {
    return classifySkillOrigin(location, {
      home: sync.data.path.home,
      config: sync.data.path.config,
      directory: sync.data.path.directory,
      worktree: sync.data.path.worktree,
    })
  }

  const [importStore, setImportStore] = createStore({
    open: false,
    url: "",
    submitting: false,
  })

  const skills = createMemo(() => {
    return cfg.skills.map((s) => ({
      ...s,
      origin: classifyOrigin(s.location),
    }))
  })

  const managed = createMemo(() => skills().filter((s) => s.origin === "managed-global"))
  const inherited = createMemo(() => skills().filter((s) => s.origin !== "managed-global"))

  const openLocation = (path: string) => {
    if (!platform.openPath) return
    const lastSep = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))
    const dir = lastSep > 0 ? path.slice(0, lastSep) : path
    void platform.openPath(dir).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: lang.t("common.requestFailed"), description: message })
    })
  }

  const remove = async (item: SkillItem) => {
    await cfg.skillOps
      .remove(item.location)
      .then(() => {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: lang.t("settings.skills.remove.success", { name: item.name }),
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: lang.t("common.requestFailed"), description: message })
      })
  }

  const pickDir = async () => {
    const paths = await platform.openDirectoryPickerDialog?.({ title: lang.t("settings.skills.import.selectDir") })
    if (!paths) return
    const path = Array.isArray(paths) ? paths[0] : paths
    if (path) setImportStore("url", path)
  }

  const pickFile = async () => {
    const paths = await platform.openFilePickerDialog?.({ title: lang.t("settings.skills.import.selectFile") })
    if (!paths) return
    const path = Array.isArray(paths) ? paths[0] : paths
    if (path) setImportStore("url", path)
  }

  const submitImport = async () => {
    if (!importStore.url.trim()) return
    setImportStore("submitting", true)
    await cfg.skillOps
      .import(importStore.url.trim())
      .then(() => {
        setImportStore({ open: false, url: "", submitting: false })
        showToast({
          variant: "success",
          icon: "circle-check",
          title: lang.t("settings.skills.import.success"),
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        showToast({ title: lang.t("common.requestFailed"), description: message })
      })
      .finally(() => setImportStore("submitting", false))
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex items-center justify-between pt-6 pb-8 max-w-[720px]">
          <div class="flex flex-col gap-1">
            <h2 class="text-16-medium text-text-strong">{lang.t("settings.skills.title")}</h2>
          </div>
          <Button
            size="large"
            variant="secondary"
            icon="plus-small"
            data-action="skill-import-open"
            onClick={() => setImportStore("open", true)}
          >
            {lang.t("common.import")}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-8 max-w-[720px]">
        <Show when={importStore.open}>
          <div class="flex flex-col gap-3 bg-surface-raised-base p-4 rounded-lg">
            <h3 class="text-14-medium text-text-strong">{lang.t("settings.skills.import.title")}</h3>
            <div class="flex gap-2">
              <Button size="large" variant="secondary" data-action="skill-import-dir" onClick={pickDir}>
                {lang.t("settings.skills.import.chooseDir")}
              </Button>
              <Button size="large" variant="secondary" data-action="skill-import-file" onClick={pickFile}>
                {lang.t("settings.skills.import.chooseFile")}
              </Button>
            </div>
            <Show when={importStore.url}>
              <div class="text-14-regular text-text-base">{importStore.url}</div>
            </Show>
            <div class="flex gap-2 justify-end">
              <Button
                size="large"
                variant="ghost"
                onClick={() => setImportStore({ open: false, url: "", submitting: false })}
              >
                {lang.t("common.cancel")}
              </Button>
              <Button
                size="large"
                variant="primary"
                disabled={!importStore.url.trim() || importStore.submitting}
                data-action="skill-import-submit"
                onClick={submitImport}
              >
                {lang.t("common.import")}
              </Button>
            </div>
          </div>
        </Show>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">{lang.t("settings.skills.section.managed")}</h3>
          <div class="bg-surface-raised-base px-4 rounded-lg">
            <Show
              when={managed().length > 0}
              fallback={
                <div class="py-4 text-14-regular text-text-weak">{lang.t("settings.skills.managed.empty")}</div>
              }
            >
              <For each={managed()}>
                {(item) => (
                  <div
                    class="group flex flex-wrap items-center justify-between gap-4 min-h-16 py-3 border-b border-border-weak-base last:border-none"
                    data-testid={`skill-row-${item.name}`}
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-14-medium text-text-strong truncate">{item.name}</span>
                      <Tag data-testid={`skill-origin-${item.name}`}>{originLabel(item.origin, lang.t)}</Tag>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        size="large"
                        variant="ghost"
                        data-action={`skill-open-location-${item.name}`}
                        onClick={() => openLocation(item.location)}
                      >
                        {lang.t("common.openLocation")}
                      </Button>
                      <Button
                        size="large"
                        variant="ghost"
                        data-action={`skill-remove-${item.name}`}
                        onClick={() => void remove(item)}
                      >
                        {lang.t("common.remove")}
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">{lang.t("settings.skills.section.inherited")}</h3>
          <div class="bg-surface-raised-base px-4 rounded-lg">
            <Show
              when={inherited().length > 0}
              fallback={
                <div class="py-4 text-14-regular text-text-weak">{lang.t("settings.skills.inherited.empty")}</div>
              }
            >
              <For each={inherited()}>
                {(item) => (
                  <div
                    class="flex flex-wrap items-center justify-between gap-4 min-h-16 py-3 border-b border-border-weak-base last:border-none"
                    data-testid={`skill-row-${item.name}`}
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-14-medium text-text-strong truncate">{item.name}</span>
                      <Tag data-testid={`skill-origin-${item.name}`}>{originLabel(item.origin, lang.t)}</Tag>
                    </div>
                    <Button
                      size="large"
                      variant="ghost"
                      data-action={`skill-open-location-${item.name}`}
                      onClick={() => openLocation(item.location)}
                    >
                      {lang.t("common.openLocation")}
                    </Button>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
