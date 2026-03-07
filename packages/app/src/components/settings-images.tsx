import { useFilteredList } from "@opencode-ai/ui/hooks"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@opencode-ai/ui/toast"
import { type Component, For, Show, createMemo } from "solid-js"
import { useLanguage } from "@/context/language"
import { useGlobalSync } from "@/context/global-sync"
import { useProviders } from "@/hooks/use-providers"

type ProviderModel = {
  id: string
  name: string
  modalities?: {
    output?: string[]
  }
  capabilities?: {
    output?: {
      image?: boolean
    }
  }
}

type ModelItem = Partial<ProviderModel> & {
  id: string
  name: string
  provider: {
    id: string
    name: string
  }
}

type ProviderItem = {
  id: string
  name: string
  models: Record<string, ProviderModel>
}

const supportedProviders = new Set(["google", "google-vertex"])

const curatedModels: Record<string, Array<Pick<ModelItem, "id" | "name">>> = {
  google: [
    {
      id: "gemini-3.1-flash-image-preview",
      name: "Nano Banana 2",
    },
    {
      id: "gemini-3-pro-image-preview",
      name: "Nano Banana Pro",
    },
    {
      id: "gemini-2.5-flash-image",
      name: "Nano Banana",
    },
  ],
}

function text(value: string | undefined, fallback: string) {
  if (!value || value === fallback) return fallback
  return value
}

export function hasImageCapability(model: ProviderModel): boolean {
  if (model.capabilities?.output?.image === true) return true
  if (model.modalities?.output?.includes("image")) return true
  if (model.id?.toLowerCase().includes("image")) return true
  return false
}

export function listImageModels(connected: ProviderItem[]) {
  const items: ModelItem[] = []

  for (const provider of connected) {
    if (!supportedProviders.has(provider.id)) continue

    const models = new Map<string, ModelItem>()
    const curated = curatedModels[provider.id]

    if (curated) {
      for (const model of curated) {
        models.set(model.id, {
          id: model.id,
          name: model.name,
          provider: {
            id: provider.id,
            name: provider.name,
          },
        })
      }
    } else {
      for (const model of Object.values(provider.models)) {
        if (hasImageCapability(model)) {
          models.set(model.id, {
            ...model,
            provider: {
              id: provider.id,
              name: provider.name,
            },
          })
        }
      }
    }

    items.push(...models.values())
  }

  return items
}

export function findCurrentImageModel(items: ModelItem[], configValue: string | undefined) {
  if (!configValue) return undefined

  const parts = configValue.split("/")
  if (parts.length !== 2) return undefined

  const [providerID, modelID] = parts
  return items.find((m) => m.provider.id === providerID && m.id === modelID)
}

const ListLoadingState: Component<{ label: string }> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <span class="text-14-regular text-text-weak">{props.label}</span>
    </div>
  )
}

const ListEmptyState: Component<{ message: string; filter: string }> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <span class="text-14-regular text-text-weak">{props.message}</span>
      <Show when={props.filter}>
        <span class="text-14-regular text-text-strong mt-1">&quot;{props.filter}&quot;</span>
      </Show>
    </div>
  )
}

export const SettingsImages: Component = () => {
  const language = useLanguage()
  const globalSync = useGlobalSync()
  const providers = useProviders()
  const title = () => text(language.t("settings.images.title"), "Images")
  const description = () =>
    text(language.t("settings.images.description"), "Choose which model to use for generated images.")
  const placeholder = () => text(language.t("settings.images.search.placeholder"), "Search image models")
  const emptyFilter = () => text(language.t("settings.images.empty.filter"), "No image models match your search")
  const emptyProviders = () =>
    text(language.t("settings.images.empty.noProviders"), "Connect Google or Google Vertex first")

  const imageModels = createMemo(() => {
    return listImageModels(providers.connected())
  })

  const list = useFilteredList<ModelItem>({
    items: () => imageModels(),
    key: (x) => `${x.provider.id}:${x.id}`,
    filterKeys: ["provider.name", "name", "id"],
    sortBy: (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
    groupBy: (x) => x.provider.id,
    sortGroupsBy: (a, b) => {
      const aName = a.items[0].provider.name
      const bName = b.items[0].provider.name
      return aName.localeCompare(bName)
    },
  })

  const currentModel = createMemo(() => {
    const config = globalSync.data.config
    return config.image_model
  })

  const handleModelChange = async (modelID: string | undefined, providerID: string | undefined) => {
    if (!modelID || !providerID) return

    const fullModelId = `${providerID}/${modelID}`
    const before = globalSync.data.config.image_model
    globalSync.set("config", "image_model", fullModelId)

    try {
      await globalSync.updateConfig({ image_model: fullModelId })
    } catch (err: unknown) {
      globalSync.set("config", "image_model", before)
      const message = err instanceof Error ? err.message : String(err)
      showToast({
        title: language.t("common.requestFailed"),
        description: message,
      })
    }
  }

  const flatModels = createMemo(() => list.flat())
  const currentModelObj = createMemo(() => {
    return findCurrentImageModel(flatModels(), currentModel())
  })

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-4 pt-6 pb-6 max-w-[720px] w-full">
          <h2 class="text-16-medium text-text-strong">{title()}</h2>
          <p class="text-14-regular text-text-weak">{description()}</p>
          <div class="flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-base">
            <Icon name="magnifying-glass" class="text-icon-weak-base flex-shrink-0" />
            <TextField
              variant="ghost"
              type="text"
              value={list.filter()}
              onChange={list.onInput}
              placeholder={placeholder()}
              spellcheck={false}
              autocorrect="off"
              autocomplete="off"
              autocapitalize="off"
              class="flex-1"
            />
            <Show when={list.filter()}>
              <IconButton icon="circle-x" variant="ghost" onClick={list.clear} />
            </Show>
          </div>
        </div>
      </div>

      <div class="flex min-h-[320px] flex-1 flex-col gap-8 max-w-[720px] w-full">
        <Show
          when={!list.grouped.loading}
          fallback={
            <ListLoadingState label={`${language.t("common.loading")}${language.t("common.loading.ellipsis")}`} />
          }
        >
          <Show
            when={flatModels().length > 0}
            fallback={
              <ListEmptyState message={list.filter() ? emptyFilter() : emptyProviders()} filter={list.filter()} />
            }
          >
            <For each={list.grouped.latest}>
              {(group) => (
                <div class="flex flex-col gap-1 w-full">
                  <div class="flex items-center gap-2 pb-2">
                    <ProviderIcon id={group.category} class="size-5 shrink-0 icon-strong-base" />
                    <span class="text-14-medium text-text-strong">{group.items[0].provider.name}</span>
                  </div>
                  <div class="bg-surface-raised-base px-4 py-2 rounded-lg w-full">
                    <RadioGroup
                      options={group.items}
                      current={currentModelObj()}
                      value={(m) => (m ? `${m.provider.id}/${m.id}` : "")}
                      label={(m) => m?.name ?? ""}
                      onSelect={(m) => {
                        if (!m) return
                        void handleModelChange(m.id, m.provider.id)
                      }}
                    />
                  </div>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </div>
  )
}
