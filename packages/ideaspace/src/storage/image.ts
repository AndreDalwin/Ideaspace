import path from "path"
import { Filesystem } from "@/util/filesystem"
import { Identifier } from "@/id/id"
import type { MessageV2 } from "@/session/message-v2"
import { Instance } from "@/project/instance"

export namespace ImageStorage {
  export const UnsupportedMimeError = class extends Error {
    constructor(mime: string) {
      super(`Unsupported MIME type for image storage: ${mime}`)
      this.name = "UnsupportedMimeError"
    }
  }

  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/avif": "avif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  }

  function isImageMime(mime: string): boolean {
    return mime.startsWith("image/") && mime in mimeToExt
  }

  function getExtension(mime: string): string {
    return mimeToExt[mime] || "bin"
  }

  function bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64")
  }

  function buildDataUrl(mime: string, base64: string): string {
    return `data:${mime};base64,${base64}`
  }

  function buildResourceUri(sessionID: string, messageID: string, filename: string): string {
    return `ideaspace://image/${sessionID}/${messageID}/${filename}`
  }

  function slug(input: string | undefined) {
    if (!input) return "image"
    const value = input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64)
    return value || "image"
  }

  function name(mime: string, hint?: string) {
    const ext = getExtension(mime)
    if (!hint) return `image.${ext}`
    return `${slug(hint)}-${Identifier.ascending("part").slice(-6)}.${ext}`
  }

  export interface PersistResult {
    path: string
    part: MessageV2.FilePart
  }

  export async function persist(
    bytes: Uint8Array,
    sessionID: string,
    messageID: string,
    mime: string,
    hint?: string,
  ): Promise<PersistResult> {
    if (!isImageMime(mime)) {
      throw new UnsupportedMimeError(mime)
    }

    const filename = name(mime, hint)
    const dir = path.join(Instance.directory, ".ideaspace", "images", sessionID, messageID)
    const filepath = path.join(dir, filename)

    await Filesystem.write(filepath, bytes)

    const base64 = bytesToBase64(bytes)
    const dataUrl = buildDataUrl(mime, base64)
    const resourceUri = buildResourceUri(sessionID, messageID, filename)

    const part: MessageV2.FilePart = {
      id: Identifier.ascending("part"),
      sessionID,
      messageID,
      type: "file",
      mime,
      filename,
      url: dataUrl,
      source: {
        type: "resource",
        clientName: "ideaspace",
        uri: resourceUri,
        text: {
          value: resourceUri,
          start: 0,
          end: resourceUri.length,
        },
      },
    }

    return { path: filepath, part }
  }
}
