import { beforeAll, describe, expect, mock, test } from "bun:test"

let hasImageCapability: typeof import("./settings-images").hasImageCapability
let listImageModels: typeof import("./settings-images").listImageModels
let findCurrentImageModel: typeof import("./settings-images").findCurrentImageModel

function createMockProviders() {
  const googleModels: Record<string, Parameters<typeof hasImageCapability>[0]> = {
    "gemini-flash": {
      id: "gemini-flash",
      name: "Gemini Flash Google",
      capabilities: { output: { image: true } },
    },
    "gemini-pro": {
      id: "gemini-pro",
      name: "Gemini Pro",
      capabilities: { output: { image: false } },
    },
  }

  const vertexModels: Record<string, Parameters<typeof hasImageCapability>[0]> = {
    "gemini-flash": {
      id: "gemini-flash",
      name: "Gemini Flash Vertex",
      capabilities: { output: { image: true } },
    },
    "imagen-3": {
      id: "imagen-3",
      name: "Imagen 3",
      capabilities: { output: { image: true } },
    },
  }

  const openaiModels: Record<string, Parameters<typeof hasImageCapability>[0]> = {
    "gpt-4": {
      id: "gpt-4",
      name: "GPT-4",
      capabilities: { output: { image: true } },
    },
  }

  return [
    {
      id: "google",
      name: "Google",
      models: googleModels,
    },
    {
      id: "google-vertex",
      name: "Google Vertex",
      models: vertexModels,
    },
    {
      id: "openai",
      name: "OpenAI",
      models: openaiModels,
    },
  ]
}

beforeAll(async () => {
  mock.module("@opencode-ai/ui/hooks", () => ({
    useFilteredList: () => ({
      filter: () => "",
      onInput: () => {},
      clear: () => {},
      flat: () => [],
      grouped: { loading: false, latest: [] },
    }),
  }))
  mock.module("@opencode-ai/ui/provider-icon", () => ({ ProviderIcon: () => null }))
  mock.module("@opencode-ai/ui/radio-group", () => ({ RadioGroup: () => null }))
  mock.module("@opencode-ai/ui/icon", () => ({ Icon: () => null }))
  mock.module("@opencode-ai/ui/icon-button", () => ({ IconButton: () => null }))
  mock.module("@opencode-ai/ui/text-field", () => ({ TextField: () => null }))
  mock.module("@opencode-ai/ui/toast", () => ({ showToast: () => {} }))
  mock.module("@/context/language", () => ({ useLanguage: () => ({ t: (key: string) => key }) }))
  mock.module("@/context/global-sync", () => ({
    useGlobalSync: () => ({
      data: { config: {} },
      set: () => {},
      updateConfig: async () => {},
    }),
  }))
  mock.module("@/hooks/use-providers", () => ({
    useProviders: () => ({
      connected: () => [],
    }),
  }))

  const mod = await import("./settings-images")
  hasImageCapability = mod.hasImageCapability
  listImageModels = mod.listImageModels
  findCurrentImageModel = mod.findCurrentImageModel
})

describe("SettingsImages model listing", () => {
  test("keeps curated google entries and vertex entries distinct", () => {
    const items = listImageModels(createMockProviders())

    const googleNano = items.find((item) => item.provider.id === "google" && item.id === "gemini-2.5-flash-image")
    const vertexFlash = items.find((item) => item.provider.id === "google-vertex" && item.id === "gemini-flash")

    expect(googleNano?.name).toBe("Nano Banana")
    expect(vertexFlash?.name).toBe("Gemini Flash Vertex")
  })

  test("excludes unsupported providers even when they expose image capability", () => {
    const items = listImageModels(createMockProviders())
    expect(items.find((item) => item.provider.id === "openai")).toBeUndefined()
    expect(items.find((item) => item.provider.id === "google")).toBeDefined()
  })

  test("adds curated Nano Banana models for google", () => {
    const items = listImageModels(createMockProviders())
    const google = items.filter((item) => item.provider.id === "google")

    expect(google.find((item) => item.id === "gemini-3.1-flash-image-preview")?.name).toBe("Nano Banana 2")
    expect(google.find((item) => item.id === "gemini-3-pro-image-preview")?.name).toBe("Nano Banana Pro")
    expect(google.find((item) => item.id === "gemini-2.5-flash-image")?.name).toBe("Nano Banana")
    expect(google.find((item) => item.id === "gemini-2.5-flash-image-preview")).toBeUndefined()
  })

  test("finds current model by full provider/model identity", () => {
    const items = listImageModels(createMockProviders())

    const current = findCurrentImageModel(items, "google-vertex/gemini-flash")

    expect(current?.provider.id).toBe("google-vertex")
    expect(current?.id).toBe("gemini-flash")
    expect(current?.name).toBe("Gemini Flash Vertex")
  })

  test("finds curated google models by full provider/model identity", () => {
    const items = listImageModels(createMockProviders())

    const current = findCurrentImageModel(items, "google/gemini-2.5-flash-image")
    const matches = items.filter(
      (item) => `${item.provider.id}/${item.id}` === `${current?.provider.id}/${current?.id}`,
    )

    expect(matches).toHaveLength(1)
    expect(matches[0].provider.id).toBe("google")
    expect(matches[0].name).toBe("Nano Banana")
  })
})

describe("SettingsImages capability detection", () => {
  test("hasImageCapability checks capabilities.output.image === true first", () => {
    const model = {
      id: "test",
      name: "Test",
      capabilities: { output: { image: true } },
    } as Parameters<typeof hasImageCapability>[0]
    expect(hasImageCapability(model)).toBe(true)
  })

  test("hasImageCapability falls back to modalities.output.includes(image)", () => {
    const model = {
      id: "test",
      name: "Test",
      capabilities: { output: { image: false } },
      modalities: { output: ["image"] },
    } as Parameters<typeof hasImageCapability>[0]
    expect(hasImageCapability(model)).toBe(true)
  })

  test("hasImageCapability falls back to id substring containing image", () => {
    const model = {
      id: "my-image-model",
      name: "Test",
    } as Parameters<typeof hasImageCapability>[0]
    expect(hasImageCapability(model)).toBe(true)
  })

  test("hasImageCapability excludes models without image support", () => {
    const model = {
      id: "text-embedding",
      name: "Text Embedding",
      capabilities: { output: { image: false } },
      modalities: { output: ["text"] },
    } as Parameters<typeof hasImageCapability>[0]
    expect(hasImageCapability(model)).toBe(false)
  })
})
