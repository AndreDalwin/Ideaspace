import { describe, expect, test } from "bun:test"

const path = new URL("./message-part.tsx", import.meta.url)

describe("message part image attachments", () => {
  test("reuses FileAttachments for user messages", async () => {
    const src = await Bun.file(path).text()

    expect(src).toContain("function FileAttachments(props: FileAttachmentsProps)")
    expect(src).toContain("<FileAttachments")
    expect(src).toContain("files={attachments}")
  })

  test("shows completed tool image attachments inline", async () => {
    const src = await Bun.file(path).text()

    expect(src).toContain('state.attachments?.filter((a) => a.mime.startsWith("image/")) ?? []')
    expect(src).toContain(
      "<FileAttachments files={attachments} onImageClick={(file) => openImagePreview(file.url, file.filename)} />",
    )
  })
})
