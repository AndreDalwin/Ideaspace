import { test, expect } from "bun:test"

import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { ImageGen } from "../../src/provider/image-gen"
import { Env } from "../../src/env"
import { Auth } from "../../src/auth"

const originalFetch = globalThis.fetch

function mockFetch(response: Response) {
  globalThis.fetch = (() => Promise.resolve(response)) as unknown as typeof fetch
}

let capturedRequestBody: unknown = null

function mockFetchWithCapture(response: Response) {
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
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

test("generate throws MissingModelError when image_model not configured", async () => {
  await using tmp = await tmpdir({
    config: {},
  })
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      expect(ImageGen.generate("a cat")).rejects.toThrow(ImageGen.MissingModelError)
    },
  })
})

test("generate throws UnsupportedProviderError for unsupported provider", async () => {
  await using tmp = await tmpdir({
    config: {
      image_model: "openai/dall-e-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      try {
        await ImageGen.generate("a cat")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.UnsupportedProviderError.isInstance(e)).toBe(true)
        expect(e.data.providerID).toBe("openai")
        expect(e.data.supported).toContain("google")
        expect(e.data.supported).toContain("google-vertex")
      }
    },
  })
})

test("generate with google provider returns normalized result", async () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: "base64encodedimagedata",
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
      const result = await ImageGen.generate("a cat")

      expect(result.mime).toBe("image/png")
      expect(result.bytesBase64).toBe("base64encodedimagedata")
      expect(result.revisedPrompt).toBe("A fluffy cat sitting on a windowsill")
      expect(result.blockedReason).toBeUndefined()

      restoreFetch()
    },
  })
})

test("generate with google provider reads API key from auth store", async () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: "authstoreimagedata",
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
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google/gemini-2.5-flash-image",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      await Auth.set("google", {
        type: "api",
        key: "google-auth-store-key",
      })
    },
    fn: async () => {
      const result = await ImageGen.generate("a cat")

      expect(result.mime).toBe("image/png")
      expect(result.bytesBase64).toBe("authstoreimagedata")

      restoreFetch()
    },
  })
})

test("generate with google provider throws SafetyBlockedError on content block", async () => {
  const mockResponse = {
    promptFeedback: {
      blockReason: "SAFETY",
    },
    candidates: [],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
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
      try {
        await ImageGen.generate("inappropriate content")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.SafetyBlockedError.isInstance(e)).toBe(true)
        expect(e.data.providerID).toBe("google")
        expect(e.data.reason).toBe("SAFETY")
      }

      restoreFetch()
    },
  })
})

test("generate with google provider throws SafetyBlockedError on IMAGE_SAFETY finish reason", async () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [],
        },
        finishReason: "IMAGE_SAFETY",
      },
    ],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
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
      try {
        await ImageGen.generate("inappropriate content")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.SafetyBlockedError.isInstance(e)).toBe(true)
      }

      restoreFetch()
    },
  })
})

test("generate with google provider throws GenerationError with 401 message", async () => {
  mockFetch(
    new Response(JSON.stringify({}), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
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
      try {
        await ImageGen.generate("a cat")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.providerID).toBe("google")
        expect(e.data.status).toBe(401)
        expect(e.data.message).toContain("Unauthorized")
      }

      restoreFetch()
    },
  })
})

test("generate with google provider throws GenerationError with 429 message", async () => {
  mockFetch(
    new Response(JSON.stringify({}), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
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
      try {
        await ImageGen.generate("a cat")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.status).toBe(429)
        expect(e.data.message).toContain("Rate limited")
      }

      restoreFetch()
    },
  })
})

test("generate with google provider throws GenerationError when no image in response", async () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: "I cannot generate images.",
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
      try {
        await ImageGen.generate("a cat")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.message).toContain("No image data")
      }

      restoreFetch()
    },
  })
})

test("generate with google provider uses GEMINI_API_KEY fallback", async () => {
  const mockResponse = {
    candidates: [
      {
        content: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: "base64data",
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
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google/gemini-2.0-flash-exp",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GEMINI_API_KEY", "fallback-key")
    },
    fn: async () => {
      const result = await ImageGen.generate("a cat")
      expect(result.bytesBase64).toBe("base64data")
      restoreFetch()
    },
  })
})

test("generate with google provider throws GenerationError when no candidates", async () => {
  const mockResponse = {
    candidates: [],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
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
      try {
        await ImageGen.generate("a cat")
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.message).toContain("No candidates")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI returns normalized result", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "vertexbase64data",
        mimeType: "image/jpeg",
      },
    ],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      const mockToken = () => Promise.resolve("mock-token")
      const result = await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)

      expect(result.mime).toBe("image/jpeg")
      expect(result.bytesBase64).toBe("vertexbase64data")
      expect(result.revisedPrompt).toBeUndefined()

      restoreFetch()
    },
  })
})

test("callVertexAPI forwards aspectRatio to Vertex API when provided", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "vertexbase64data",
        mimeType: "image/png",
      },
    ],
  }

  mockFetchWithCapture(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      const mockToken = () => Promise.resolve("mock-token")
      const result = await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken, "16:9")

      expect(result.mime).toBe("image/png")

      expect(capturedRequestBody).toBeDefined()
      const body = capturedRequestBody as {
        parameters: { aspectRatio: string; sampleCount: number }
        instances: Array<{ prompt: string }>
      }
      expect(body.parameters.aspectRatio).toBe("16:9")
      expect(body.parameters.sampleCount).toBe(1)
      expect(body.instances[0].prompt).toBe("a cat")

      restoreFetch()
    },
  })
})

test("callVertexAPI does not include aspectRatio in request when not provided", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "vertexbase64data",
        mimeType: "image/png",
      },
    ],
  }

  mockFetchWithCapture(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      const mockToken = () => Promise.resolve("mock-token")
      await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)

      expect(capturedRequestBody).toBeDefined()
      const body = capturedRequestBody as { parameters: { aspectRatio?: string; sampleCount: number } }
      expect(body.parameters.aspectRatio).toBeUndefined()
      expect(body.parameters.sampleCount).toBe(1)

      restoreFetch()
    },
  })
})

test("callVertexAPI throws SafetyBlockedError", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "",
        safetyAttributes: {
          blocked: true,
        },
      },
    ],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("inappropriate content", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.SafetyBlockedError.isInstance(e)).toBe(true)
        expect(e.data.providerID).toBe("google-vertex")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI throws GenerationError with 401 message", async () => {
  mockFetch(
    new Response(JSON.stringify({}), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.providerID).toBe("google-vertex")
        expect(e.data.status).toBe(401)
        expect(e.data.message).toContain("Unauthorized")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI throws GenerationError with 403 message", async () => {
  mockFetch(
    new Response(JSON.stringify({}), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.status).toBe(403)
        expect(e.data.message).toContain("Forbidden")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI throws GenerationError with 429 message", async () => {
  mockFetch(
    new Response(JSON.stringify({}), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.status).toBe(429)
        expect(e.data.message).toContain("Rate limited")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI throws GenerationError when no image data", async () => {
  const mockResponse = {
    predictions: [{}],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    init: async () => {
      Env.set("GOOGLE_CLOUD_PROJECT", "test-project")
    },
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.message).toContain("No image data")
      }

      restoreFetch()
    },
  })
})

test("callVertexAPI uses config provider options for project", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "data",
        mimeType: "image/png",
      },
    ],
  }

  mockFetch(
    new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  )

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
      provider: {
        "google-vertex": {
          options: {
            project: "config-project",
            location: "europe-west4",
          },
        },
      },
    },
  })
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const mockToken = () => Promise.resolve("mock-token")
      const result = await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
      expect(result.bytesBase64).toBe("data")
      restoreFetch()
    },
  })
})

test("callVertexAPI uses config provider options for location", async () => {
  const mockResponse = {
    predictions: [
      {
        bytesBase64Encoded: "data",
        mimeType: "image/png",
      },
    ],
  }

  let capturedUrl: string | null = null
  globalThis.fetch = ((input: RequestInfo | URL) => {
    capturedUrl = input.toString()
    return Promise.resolve(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
  }) as unknown as typeof fetch

  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
      provider: {
        "google-vertex": {
          options: {
            project: "test-project",
            location: "asia-northeast1",
          },
        },
      },
    },
  })
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const mockToken = () => Promise.resolve("mock-token")
      await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
      expect(capturedUrl).toContain("asia-northeast1")
      restoreFetch()
    },
  })
})

test("callVertexAPI throws GenerationError when project not configured", async () => {
  await using tmp = await tmpdir({
    config: {
      image_model: "google-vertex/imagen-3",
    },
  })
  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      try {
        const mockToken = () => Promise.resolve("mock-token")
        await ImageGen.callVertexAPI("a cat", "imagen-3", mockToken)
        expect(true).toBe(false)
      } catch (e: any) {
        expect(ImageGen.GenerationError.isInstance(e)).toBe(true)
        expect(e.data.message).toContain("GOOGLE_CLOUD_PROJECT")
      }
    },
  })
})

test("Result schema validates successful response", () => {
  const valid = {
    mime: "image/png",
    bytesBase64: "base64data",
    revisedPrompt: "A cat",
  }

  const parsed = ImageGen.Result.parse(valid)
  expect(parsed.mime).toBe("image/png")
  expect(parsed.bytesBase64).toBe("base64data")
  expect(parsed.revisedPrompt).toBe("A cat")
})

test("Result schema validates without optional fields", () => {
  const valid = {
    mime: "image/jpeg",
    bytesBase64: "base64data",
  }

  const parsed = ImageGen.Result.parse(valid)
  expect(parsed.mime).toBe("image/jpeg")
  expect(parsed.revisedPrompt).toBeUndefined()
  expect(parsed.blockedReason).toBeUndefined()
})
