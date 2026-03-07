import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { ImageGenerateTool } from "../../src/tool/image_generate"
import { ToolRegistry } from "../../src/tool/registry"
import { Env } from "../../src/env"
import path from "path"

const originalFetch = globalThis.fetch
const originalHome = process.env.IDEASPACE_HOME

let capturedRequestBody: any = null

function mockFetch(response: Response, captureBody = false) {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (captureBody && init?.body) {
      try {
        capturedRequestBody = JSON.parse(init.body as string)
      } catch {
        capturedRequestBody = init.body
      }
    }
    return Promise.resolve(response)
  }) as unknown as typeof fetch
}

function restoreFetch() {
  globalThis.fetch = originalFetch
  capturedRequestBody = null
}

const ctx = {
  sessionID: "test-session",
  messageID: "test-message",
  callID: "test-call",
  agent: "test-agent",
  abort: AbortSignal.any([]),
  messages: [],
  metadata: () => {},
  ask: async () => {},
}

describe("tool.image_generate", () => {
  beforeEach(() => {
    if (originalHome) delete process.env.IDEASPACE_HOME
  })

  afterEach(() => {
    restoreFetch()
    if (originalHome) process.env.IDEASPACE_HOME = originalHome
  })

  test("is included in ToolRegistry.ids()", async () => {
    await using tmp = await tmpdir()
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const ids = await ToolRegistry.ids()
        expect(ids).toContain("image_generate")
      },
    })
  }, 30000)

  test("successful execution forwards aspect_ratio to API and returns completed state", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
                },
              },
              {
                text: "A fluffy cat sitting on a windowsill",
              },
            ],
          },
          finishReason: "STOP",
        },
      ],
    }

    mockFetch(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      true,
    )

    await using tmp = await tmpdir({
      config: {
        image_model: "google/gemini-2.0-flash-exp",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        Env.set("GOOGLE_GENERATIVE_AI_API_KEY", "test-api-key")
      },
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        const result = await tool.execute({ prompt: "A cat sitting on a windowsill", aspect_ratio: "16:9" }, ctx)

        expect(result.title).toBe("Generated image")
        expect(result.output).toContain("Image generated successfully")
        expect(result.output).toContain("Provider: google")
        expect(result.output).toContain("Model: gemini-2.0-flash-exp")
        expect(result.output).toContain("A cat sitting on a windowsill")
        expect(result.output).toContain("Aspect ratio: 16:9")

        expect(result.attachments).toBeDefined()
        expect(result.attachments?.length).toBe(1)

        const attachment = result.attachments?.[0]
        expect(attachment?.type).toBe("file")
        expect(attachment?.mime).toBe("image/png")
        expect(attachment?.filename).toMatch(/^a-fluffy-cat-sitting-on-a-windowsill-[A-Za-z0-9]+\.png$/)
        expect(attachment?.url).toStartWith("data:image/png;base64,")
        expect(attachment?.source?.type).toBe("resource")
        if (attachment?.source?.type === "resource") {
          expect(attachment.source.clientName).toBe("ideaspace")
          expect(attachment.source.uri).toStartWith("ideaspace://image/")
        }

        expect(result.metadata.provider).toBe("google")
        expect(result.metadata.model).toBe("gemini-2.0-flash-exp")
        expect(result.metadata.prompt).toBe("A cat sitting on a windowsill")
        expect(result.metadata.aspect_ratio).toBe("16:9")
        expect(result.metadata.mime).toBe("image/png")
        expect(result.metadata.revisedPrompt).toBe("A fluffy cat sitting on a windowsill")
        expect(result.metadata.path).toBeDefined()
        expect(result.metadata.path).toContain(path.join(".ideaspace", "images"))
        expect(result.metadata.path).toContain("a-fluffy-cat-sitting-on-a-windowsill-")

        expect(capturedRequestBody).toBeDefined()
        expect(capturedRequestBody.generationConfig).toBeDefined()
        expect(capturedRequestBody.generationConfig.imageConfig.aspectRatio).toBe("16:9")
        expect(capturedRequestBody.contents[0].parts[0].text).toBe("A cat sitting on a windowsill")
      },
    })
  })

  test("throws clear error when image_model not configured", async () => {
    await using tmp = await tmpdir({
      config: {},
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        try {
          await tool.execute({ prompt: "A cat" }, ctx)
          expect(true).toBe(false)
        } catch (e: any) {
          expect(e.message).toContain("Image generation is not configured")
          expect(e.message).toContain("Settings > Images")
        }
      },
    })
  })

  test("throws clear error for unsupported provider", async () => {
    await using tmp = await tmpdir({
      config: {
        image_model: "openai/dall-e-3",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        try {
          await tool.execute({ prompt: "A cat" }, ctx)
          expect(true).toBe(false)
        } catch (e: any) {
          expect(e.message).toContain("openai")
          expect(e.message).toContain("not supported")
          expect(e.message).toContain("Settings > Images")
        }
      },
    })
  })

  test("aspect_ratio is optional and not forwarded to API when not provided", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
                },
              },
            ],
          },
          finishReason: "STOP",
        },
      ],
    }

    mockFetch(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
      true,
    )

    await using tmp = await tmpdir({
      config: {
        image_model: "google/gemini-2.0-flash-exp",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        Env.set("GOOGLE_GENERATIVE_AI_API_KEY", "test-api-key")
      },
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        const result = await tool.execute({ prompt: "A dog in a park" }, ctx)

        expect(result.output).toContain("A dog in a park")
        expect(result.output).not.toContain("Aspect ratio")

        expect(result.metadata.prompt).toBe("A dog in a park")
        expect(result.metadata.aspect_ratio).toBeUndefined()

        expect(capturedRequestBody).toBeDefined()
        expect(capturedRequestBody.generationConfig).toBeDefined()
        expect(capturedRequestBody.generationConfig.imageConfig).toBeUndefined()
      },
    })
  })

  test("throws error for invalid provider format (no slash)", async () => {
    await using tmp = await tmpdir({
      config: {
        image_model: "invalid-model-id",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        try {
          await tool.execute({ prompt: "A cat" }, ctx)
          expect(true).toBe(false)
        } catch (e: any) {
          expect(e.message).toContain("invalid-model-id")
          expect(e.message).toContain("not supported")
        }
      },
    })
  })

  test("surfaces provider helper error message instead of named error class", async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          error: {
            message: "Model gemini-3.1-flash-image-preview is not available for this API key",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    await using tmp = await tmpdir({
      config: {
        image_model: "google/gemini-3.1-flash-image-preview",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        Env.set("GOOGLE_GENERATIVE_AI_API_KEY", "test-api-key")
      },
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        try {
          await tool.execute({ prompt: "A fox in snow" }, ctx)
          expect(true).toBe(false)
        } catch (e: any) {
          expect(e.message).toContain("Model gemini-3.1-flash-image-preview is not available for this API key")
          expect(e.message).not.toContain("ImageGenGenerationError")
        }
      },
    })
  })

  test("surfaces safety block reason clearly", async () => {
    const mockResponse = {
      promptFeedback: {
        blockReason: "SAFETY",
      },
    }

    mockFetch(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await using tmp = await tmpdir({
      config: {
        image_model: "google/gemini-2.5-flash-image",
      },
    })
    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        Env.set("GOOGLE_GENERATIVE_AI_API_KEY", "test-api-key")
      },
      fn: async () => {
        const tool = await ImageGenerateTool.init()
        try {
          await tool.execute({ prompt: "unsafe content" }, ctx)
          expect(true).toBe(false)
        } catch (e: any) {
          expect(e.message).toContain("Image generation was blocked")
          expect(e.message).toContain("SAFETY")
          expect(e.message).not.toContain("ImageGenSafetyBlockedError")
        }
      },
    })
  })
})
