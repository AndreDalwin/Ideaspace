import z from "zod"
import { Config } from "../config/config"
import { Env } from "../env"
import { NamedError } from "@opencode-ai/util/error"
import { GoogleAuth } from "google-auth-library"
import { Log } from "../util/log"
import { Auth } from "../auth"

export namespace ImageGen {
  const log = Log.create({ service: "image-gen" })

  export const Result = z.object({
    mime: z.string(),
    bytesBase64: z.string(),
    revisedPrompt: z.string().optional(),
    blockedReason: z.string().optional(),
  })
  export type Result = z.infer<typeof Result>

  export const UnsupportedProviderError = NamedError.create(
    "ImageGenUnsupportedProviderError",
    z.object({
      providerID: z.string(),
      supported: z.array(z.string()),
    }),
  )

  export const MissingModelError = NamedError.create("ImageGenMissingModelError", z.object({}))

  export const GenerationError = NamedError.create(
    "ImageGenGenerationError",
    z.object({
      providerID: z.string(),
      modelID: z.string(),
      status: z.number().optional(),
      message: z.string(),
    }),
  )

  export const SafetyBlockedError = NamedError.create(
    "ImageGenSafetyBlockedError",
    z.object({
      providerID: z.string(),
      modelID: z.string(),
      reason: z.string(),
    }),
  )

  type ProviderType = "google" | "google-vertex"

  const SUPPORTED_PROVIDERS: ProviderType[] = ["google", "google-vertex"]

  function parseModelID(modelID: string): { providerID: string; modelID: string } {
    const [providerID, ...rest] = modelID.split("/")
    return {
      providerID,
      modelID: rest.join("/"),
    }
  }

  async function getGoogleApiKey(): Promise<string | undefined> {
    const config = await Config.get()
    const auth = await Auth.get("google")
    return (
      config.provider?.["google"]?.options?.apiKey ??
      (auth?.type === "api" ? auth.key : undefined) ??
      Env.get("GOOGLE_GENERATIVE_AI_API_KEY") ??
      Env.get("GEMINI_API_KEY")
    )
  }

  async function getVertexCredentials() {
    const config = await Config.get()
    const providerConfig = config.provider?.["google-vertex"]

    const project =
      providerConfig?.options?.project ??
      Env.get("GOOGLE_CLOUD_PROJECT") ??
      Env.get("GCP_PROJECT") ??
      Env.get("GCLOUD_PROJECT")

    const location =
      providerConfig?.options?.location ??
      Env.get("GOOGLE_CLOUD_LOCATION") ??
      Env.get("VERTEX_LOCATION") ??
      "us-central1"

    const endpoint = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`

    return { project, location, endpoint }
  }

  async function callGoogleAPI(prompt: string, modelID: string, aspectRatio?: string): Promise<Result> {
    const apiKey = await getGoogleApiKey()
    if (!apiKey) {
      throw new GenerationError({
        providerID: "google",
        modelID,
        message: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable required",
      })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelID}:generateContent?key=${apiKey}`

    const generationConfig: {
      responseModalities: string[]
      imageConfig?: {
        aspectRatio?: string
      }
    } = {
      responseModalities: ["TEXT", "IMAGE"],
    }

    if (aspectRatio) {
      generationConfig.imageConfig = {
        aspectRatio,
      }
    }

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig,
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      const message = getGoogleErrorMessage(response.status, errorText)
      throw new GenerationError({
        providerID: "google",
        modelID,
        status: response.status,
        message,
      })
    }

    const data = await response.json()

    // Check for safety blocks
    const promptFeedback = data.promptFeedback
    if (promptFeedback?.blockReason) {
      throw new SafetyBlockedError({
        providerID: "google",
        modelID,
        reason: promptFeedback.blockReason,
      })
    }

    // Extract image from candidates
    const candidate = data.candidates?.[0]
    if (!candidate) {
      throw new GenerationError({
        providerID: "google",
        modelID,
        message: "No candidates in response",
      })
    }

    // Check candidate finish reason
    if (candidate.finishReason === "IMAGE_SAFETY") {
      throw new SafetyBlockedError({
        providerID: "google",
        modelID,
        reason: "Image content safety blocked",
      })
    }

    const parts = candidate.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData?.data) {
      throw new GenerationError({
        providerID: "google",
        modelID,
        message: "No image data in response",
      })
    }

    const mimeType = imagePart.inlineData.mimeType ?? "image/png"
    const bytesBase64 = imagePart.inlineData.data

    // Try to extract revised prompt from text parts
    const textPart = parts.find((p: any) => p.text)
    const revisedPrompt = textPart?.text

    return {
      mime: mimeType,
      bytesBase64,
      revisedPrompt,
    }
  }

  async function getVertexAccessToken(): Promise<string> {
    const auth = new GoogleAuth()
    const client = await auth.getApplicationDefault()
    const token = await client.credential.getAccessToken()
    return token.token!
  }

  export async function callVertexAPI(
    prompt: string,
    modelID: string,
    getToken: () => Promise<string> = getVertexAccessToken,
    aspectRatio?: string,
  ): Promise<Result> {
    const { project, location, endpoint } = await getVertexCredentials()

    if (!project) {
      throw new GenerationError({
        providerID: "google-vertex",
        modelID,
        message: "GOOGLE_CLOUD_PROJECT, GCP_PROJECT, or GCLOUD_PROJECT environment variable required",
      })
    }

    const token = await getToken()
    const publisher = modelID.startsWith("imagen") ? "google" : "google"
    const url = `https://${endpoint}/v1/projects/${project}/locations/${location}/publishers/${publisher}/models/${modelID}:predict`

    const parameters: { sampleCount: number; aspectRatio?: string } = {
      sampleCount: 1,
    }

    if (aspectRatio) {
      parameters.aspectRatio = aspectRatio
    }

    const body = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters,
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      let message = getErrorMessage(response.status, errorText)
      throw new GenerationError({
        providerID: "google-vertex",
        modelID,
        status: response.status,
        message,
      })
    }

    const data = await response.json()

    if (data.predictions?.[0]?.safetyAttributes?.blocked) {
      throw new SafetyBlockedError({
        providerID: "google-vertex",
        modelID,
        reason: "Content safety blocked",
      })
    }

    const prediction = data.predictions?.[0]
    if (!prediction?.bytesBase64Encoded) {
      throw new GenerationError({
        providerID: "google-vertex",
        modelID,
        message: "No image data in response",
      })
    }

    const mimeType = prediction.mimeType ?? "image/png"

    return {
      mime: mimeType,
      bytesBase64: prediction.bytesBase64Encoded,
    }
  }

  function getErrorMessage(status: number, errorText: string): string {
    switch (status) {
      case 401:
        return "Unauthorized: Invalid or missing authentication token"
      case 403:
        return "Forbidden: Insufficient permissions for this operation"
      case 429:
        return "Rate limited: Too many requests, please retry later"
      default:
        try {
          const errorJson = JSON.parse(errorText)
          return errorJson.error?.message ?? `Image generation failed: ${status}`
        } catch {
          return `Image generation failed: ${status}`
        }
    }
  }

  function getGoogleErrorMessage(status: number, errorText: string): string {
    switch (status) {
      case 401:
        return "Unauthorized: Invalid Google API key"
      case 403:
        return "Forbidden: API key does not have permission for this operation"
      case 429:
        return "Rate limited: Quota exceeded, please retry later"
      default:
        try {
          const errorJson = JSON.parse(errorText)
          return errorJson.error?.message ?? `Image generation failed: ${status}`
        } catch {
          return `Image generation failed: ${status}`
        }
    }
  }

  export async function generate(prompt: string, opts?: { aspectRatio?: string }): Promise<Result> {
    using _ = log.time("generate")

    const config = await Config.get()
    const imageModel = config.image_model

    if (!imageModel) {
      throw new MissingModelError({})
    }

    const { providerID, modelID } = parseModelID(imageModel)

    if (!SUPPORTED_PROVIDERS.includes(providerID as ProviderType)) {
      throw new UnsupportedProviderError({
        providerID,
        supported: SUPPORTED_PROVIDERS,
      })
    }

    log.info("generating image", { providerID, modelID, aspectRatio: opts?.aspectRatio })

    if (providerID === "google") {
      return callGoogleAPI(prompt, modelID, opts?.aspectRatio)
    }

    if (providerID === "google-vertex") {
      return callVertexAPI(prompt, modelID, undefined, opts?.aspectRatio)
    }

    // This should never happen due to the type guard above
    throw new UnsupportedProviderError({
      providerID,
      supported: SUPPORTED_PROVIDERS,
    })
  }
}
