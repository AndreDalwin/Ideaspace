import { describe, expect, test } from "bun:test"

const dialogPath = new URL("./dialog-settings.tsx", import.meta.url)

describe("DialogSettings wiring", () => {
  test("adds an images tab trigger", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Trigger value="images">')
    expect(src).toContain('language.t("settings.images.title")')
  })

  test("renders the SettingsImages content panel", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Content value="images" class="no-scrollbar">')
    expect(src).toContain("<SettingsImages />")
  })
})
