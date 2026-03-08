import { describe, expect, test } from "bun:test"

const dialogPath = new URL("./dialog-settings.tsx", import.meta.url)

describe("DialogSettings wiring", () => {
  test("adds an images tab trigger", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Trigger value="images" data-action="settings-tab-images">')
    expect(src).toContain('language.t("settings.images.title")')
  })

  test("renders the SettingsImages content panel", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Content value="images" class="no-scrollbar">')
    expect(src).toContain("<SettingsImages />")
  })

  test("adds an mcp tab trigger with data-action selector", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Trigger value="mcp" data-action="settings-tab-mcp">')
    expect(src).toContain('language.t("settings.mcp.title")')
  })

  test("renders the SettingsMcp content panel", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Content value="mcp" class="no-scrollbar">')
    expect(src).toContain("<SettingsMcp />")
  })

  test("adds a skills tab trigger with data-action selector", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Trigger value="skills" data-action="settings-tab-skills">')
    expect(src).toContain('language.t("settings.skills.title")')
  })

  test("renders the SettingsSkills content panel", async () => {
    const src = await Bun.file(dialogPath).text()

    expect(src).toContain('<Tabs.Content value="skills" class="no-scrollbar">')
    expect(src).toContain("<SettingsSkills />")
  })
})
