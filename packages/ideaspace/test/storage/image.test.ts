import { describe, test, expect } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { ImageStorage } from "../../src/storage/image"
import { Filesystem } from "../../src/util/filesystem"
import { Instance } from "../../src/project/instance"

function persist(dir: string, bytes: Uint8Array, sessionID: string, messageID: string, mime: string, hint?: string) {
  return Instance.provide({
    directory: dir,
    fn: () => ImageStorage.persist(bytes, sessionID, messageID, mime, hint),
  })
}

describe("ImageStorage", () => {
  describe("persist()", () => {
    test("persists PNG image and returns FilePart with data URL and resource URI", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const pngBytes = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        )
        const sessionID = "ses_test123"
        const messageID = "msg_test456"

        const result = await persist(testHome, pngBytes, sessionID, messageID, "image/png")

        const expectedPath = path.join(testHome, ".ideaspace", "images", sessionID, messageID, "image.png")
        expect(result.path).toBe(expectedPath)
        expect(await Filesystem.exists(result.path)).toBe(true)

        const writtenBytes = await fs.readFile(result.path)
        expect(writtenBytes).toEqual(pngBytes)

        expect(result.part.type).toBe("file")
        expect(result.part.sessionID).toBe(sessionID)
        expect(result.part.messageID).toBe(messageID)
        expect(result.part.mime).toBe("image/png")
        expect(result.part.filename).toBe("image.png")

        expect(result.part.url).toStartWith("data:image/png;base64,")
        expect(result.part.url).toContain(Buffer.from(pngBytes).toString("base64"))

        expect(result.part.source?.type).toBe("resource")
        if (result.part.source?.type === "resource") {
          expect(result.part.source.clientName).toBe("ideaspace")
          expect(result.part.source.uri).toBe(`ideaspace://image/${sessionID}/${messageID}/image.png`)
          expect(result.part.source.text.value).toBe(`ideaspace://image/${sessionID}/${messageID}/image.png`)
          expect(result.part.source.text.start).toBe(0)
          expect(result.part.source.text.end).toBe(result.part.source.uri.length)
        }

        expect(result.part.id).toStartWith("prt_")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("persists JPEG image with correct extension", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
        const sessionID = "ses_jpg123"
        const messageID = "msg_jpg456"

        const result = await persist(testHome, jpegBytes, sessionID, messageID, "image/jpeg")

        expect(result.part.filename).toBe("image.jpg")
        expect(result.part.mime).toBe("image/jpeg")
        expect(result.part.url).toStartWith("data:image/jpeg;base64,")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("uses prompt hint to create a relevant filename", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const pngBytes = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        )
        const result = await persist(
          testHome,
          pngBytes,
          "ses_hint",
          "msg_hint",
          "image/png",
          "Photorealistic mountain landscape at sunset",
        )

        expect(result.part.filename).toMatch(/^photorealistic-mountain-landscape-at-sunset-[A-Za-z0-9]+\.png$/)
        expect(result.path).toContain("photorealistic-mountain-landscape-at-sunset-")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("persists WebP image with correct extension", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const webpBytes = Buffer.from("RIFF....WEBP", "utf-8")
        const sessionID = "ses_webp123"
        const messageID = "msg_webp456"

        const result = await persist(testHome, webpBytes, sessionID, messageID, "image/webp")

        expect(result.part.filename).toBe("image.webp")
        expect(result.part.url).toStartWith("data:image/webp;base64,")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("persists GIF image with correct extension", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const gifBytes = Buffer.from("GIF89a", "utf-8")
        const sessionID = "ses_gif123"
        const messageID = "msg_gif456"

        const result = await persist(testHome, gifBytes, sessionID, messageID, "image/gif")

        expect(result.part.filename).toBe("image.gif")
        expect(result.part.url).toStartWith("data:image/gif;base64,")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("persists SVG image with correct extension", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const svgBytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>', "utf-8")
        const sessionID = "ses_svg123"
        const messageID = "msg_svg456"

        const result = await persist(testHome, svgBytes, sessionID, messageID, "image/svg+xml")

        expect(result.part.filename).toBe("image.svg")
        expect(result.part.url).toStartWith("data:image/svg+xml;base64,")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("rejects non-image MIME types", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const textBytes = Buffer.from("Hello, World!", "utf-8")

        await expect(persist(testHome, textBytes, "ses_test", "msg_test", "text/plain")).rejects.toThrow(
          ImageStorage.UnsupportedMimeError,
        )

        await expect(persist(testHome, textBytes, "ses_test", "msg_test", "application/json")).rejects.toThrow(
          ImageStorage.UnsupportedMimeError,
        )

        await expect(persist(testHome, textBytes, "ses_test", "msg_test", "application/pdf")).rejects.toThrow(
          ImageStorage.UnsupportedMimeError,
        )
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("rejects unsupported image MIME types", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const bytes = Buffer.from("fake", "utf-8")

        await expect(persist(testHome, bytes, "ses_test", "msg_test", "image/xyz")).rejects.toThrow(
          ImageStorage.UnsupportedMimeError,
        )
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("creates nested directory structure", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const pngBytes = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64",
        )
        const sessionID = "ses_nested/deep/path"
        const messageID = "msg_nested"

        const result = await persist(testHome, pngBytes, sessionID, messageID, "image/png")

        const dir = path.dirname(result.path)
        const stat = await fs.stat(dir)
        expect(stat.isDirectory()).toBe(true)

        expect(await Filesystem.exists(result.path)).toBe(true)
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("handles empty image bytes", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const emptyBytes = Buffer.from([])
        const sessionID = "ses_empty"
        const messageID = "msg_empty"

        const result = await persist(testHome, emptyBytes, sessionID, messageID, "image/png")

        expect(await Filesystem.exists(result.path)).toBe(true)
        const writtenBytes = await fs.readFile(result.path)
        expect(writtenBytes.length).toBe(0)
        expect(result.part.url).toBe("data:image/png;base64,")
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })

    test("handles large image bytes", async () => {
      const testHome = path.join(process.env.TMPDIR || "/tmp", `ideaspace-test-${Date.now()}`)
      process.env.IDEASPACE_TEST_HOME = testHome

      try {
        const largeBytes = Buffer.alloc(100 * 1024, 0x42)
        const sessionID = "ses_large"
        const messageID = "msg_large"

        const result = await persist(testHome, largeBytes, sessionID, messageID, "image/png")

        expect(await Filesystem.exists(result.path)).toBe(true)
        const writtenBytes = await fs.readFile(result.path)
        expect(writtenBytes.length).toBe(largeBytes.length)
        expect(result.part.url.length).toBeGreaterThan(100000)
      } finally {
        delete process.env.IDEASPACE_TEST_HOME
        await fs.rm(testHome, { recursive: true, force: true })
      }
    })
  })
})
