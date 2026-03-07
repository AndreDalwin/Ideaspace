import z from "zod"
import { Tool } from "./tool"
import { ImageGen } from "../provider/image-gen"
import { ImageStorage } from "../storage/image"
import { Config } from "../config/config"
import { Log } from "../util/log"

const log = Log.create({ service: "image-generate-tool" })

function format(error: unknown) {
  if (ImageGen.GenerationError.isInstance(error)) return error.data.message
  if (ImageGen.SafetyBlockedError.isInstance(error)) return `Image generation was blocked: ${error.data.reason}`
  if (ImageGen.MissingModelError.isInstance(error)) {
    return "Image generation is not configured. Please set an image model in Settings > Images."
  }
  if (ImageGen.UnsupportedProviderError.isInstance(error)) {
    return `Image generation provider '${error.data.providerID}' is not supported. Please configure a Google or Google Vertex model in Settings > Images.`
  }
  if (error instanceof Error) return error.message
  return String(error)
}

export const ImageGenerateTool = Tool.define("image_generate", {
  description: [
    "Generate an image based on a text description.",
    "",
    "Parameters:",
    "- prompt: Required. A detailed description of the image to generate.",
    "- aspect_ratio: Optional. The desired aspect ratio (e.g., '1:1', '16:9', '4:3', '3:2').",
    "",
    "Example:",
    `{ "prompt": "A serene mountain landscape at sunset with snow-capped peaks", "aspect_ratio": "16:9" }`,
  ].join("\n"),
  parameters: z.object({
    prompt: z.string().describe("Detailed description of the image to generate"),
    aspect_ratio: z
      .enum(["1:1", "16:9", "4:3", "3:2", "9:16", "3:4", "2:3"])
      .optional()
      .describe("Optional aspect ratio for the generated image"),
  }),
  async execute(params, ctx) {
    using _ = log.time("execute")

    const config = await Config.get()
    const imageModel = config.image_model

    if (!imageModel) {
      throw new Error("Image generation is not configured. Please set an image model in Settings > Images.")
    }

    const [providerID, ...modelParts] = imageModel.split("/")
    const modelID = modelParts.join("/")

    if (providerID !== "google" && providerID !== "google-vertex") {
      throw new Error(
        `Image generation provider '${providerID}' is not supported. Please configure a Google or Google Vertex model in Settings > Images.`,
      )
    }

    log.info("generating image", {
      providerID,
      modelID,
      prompt: params.prompt.slice(0, 100),
      aspectRatio: params.aspect_ratio,
    })

    const result = await ImageGen.generate(params.prompt, {
      aspectRatio: params.aspect_ratio,
    }).catch((error) => {
      log.error("image generation failed", { error, imageModel, prompt: params.prompt.slice(0, 100) })
      throw new Error(format(error), { cause: error })
    })

    const bytes = Buffer.from(result.bytesBase64, "base64")

    const persisted = await ImageStorage.persist(
      bytes,
      ctx.sessionID,
      ctx.messageID,
      result.mime,
      result.revisedPrompt ?? params.prompt,
    )

    const attachment: Omit<import("../session/message-v2").MessageV2.FilePart, "id" | "sessionID" | "messageID"> = {
      type: "file",
      mime: persisted.part.mime,
      filename: persisted.part.filename,
      url: persisted.part.url,
      source: persisted.part.source,
    }

    const outputLines = [
      "Image generated successfully.",
      "",
      `Provider: ${providerID}`,
      `Model: ${modelID}`,
      `Prompt: ${params.prompt}`,
    ]

    if (result.revisedPrompt) {
      outputLines.push("")
      outputLines.push(`Revised prompt: ${result.revisedPrompt}`)
    }

    if (params.aspect_ratio) {
      outputLines.push(`Aspect ratio: ${params.aspect_ratio}`)
    }

    outputLines.push("")
    outputLines.push(`Image saved to: ${persisted.path}`)

    return {
      title: "Generated image",
      output: outputLines.join("\n"),
      attachments: [attachment],
      metadata: {
        provider: providerID,
        model: modelID,
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio,
        mime: result.mime,
        revisedPrompt: result.revisedPrompt,
        path: persisted.path,
      },
    }
  },
})
