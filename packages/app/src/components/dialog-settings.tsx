import { Component } from "solid-js"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Tabs } from "@opencode-ai/ui/tabs"
import { Icon } from "@opencode-ai/ui/icon"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { SettingsGeneral } from "./settings-general"
import { SettingsImages } from "./settings-images"
import { SettingsKeybinds } from "./settings-keybinds"
import { SettingsProviders } from "./settings-providers"
import { SettingsModels } from "./settings-models"
import { SettingsSkills } from "./settings-skills"

const SettingsMcp: Component = () => {
  const lang = useLanguage()
  return (
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between sticky top-0 bg-canvas z-10 pb-4 border-b border-border">
        <div class="flex flex-col gap-1">
          <h2 class="text-16-semibold">{lang.t("settings.mcp.title")}</h2>
          <p class="text-13-regular text-text-secondary">{lang.t("settings.mcp.description")}</p>
        </div>
      </div>
      <div class="text-13-regular text-text-secondary">MCP configuration will be available here.</div>
    </div>
  )
}

export const DialogSettings: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const images = () => language.t("settings.images.title") || "Images"

  return (
    <Dialog size="x-large" transition class="h-full overflow-hidden">
      <Tabs orientation="vertical" variant="settings" defaultValue="general" class="h-full settings-dialog">
        <Tabs.List>
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex flex-col gap-3 w-full pt-3">
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1.5">
                  <Tabs.SectionTitle>{language.t("settings.section.desktop")}</Tabs.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <Tabs.Trigger value="general">
                      <Icon name="sliders" />
                      {language.t("settings.tab.general")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="shortcuts">
                      <Icon name="keyboard" />
                      {language.t("settings.tab.shortcuts")}
                    </Tabs.Trigger>
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <Tabs.SectionTitle>{language.t("settings.section.server")}</Tabs.SectionTitle>
                  <div class="flex flex-col gap-1.5 w-full">
                    <Tabs.Trigger value="providers" data-action="settings-tab-providers">
                      <Icon name="providers" />
                      {language.t("settings.providers.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="models" data-action="settings-tab-models">
                      <Icon name="models" />
                      {language.t("settings.models.title")}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="images" data-action="settings-tab-images">
                      <Icon name="photo" />
                      {images()}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="mcp" data-action="settings-tab-mcp">
                      <Icon name="mcp" />
                      {language.t("settings.mcp.title")}
                    </Tabs.Trigger>

                    <Tabs.Trigger value="skills" data-action="settings-tab-skills">
                      <Icon name="brain" />
                      {language.t("settings.skills.title")}
                    </Tabs.Trigger>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1 pl-1 py-1 text-12-medium text-text-weak">
              <span>{language.t("app.name.desktop")}</span>
              <span class="text-11-regular">v{platform.version}</span>
            </div>
          </div>
        </Tabs.List>
        <Tabs.Content value="general" class="no-scrollbar">
          <SettingsGeneral />
        </Tabs.Content>
        <Tabs.Content value="shortcuts" class="no-scrollbar">
          <SettingsKeybinds />
        </Tabs.Content>
        <Tabs.Content value="providers" class="no-scrollbar">
          <SettingsProviders />
        </Tabs.Content>
        <Tabs.Content value="models" class="no-scrollbar">
          <SettingsModels />
        </Tabs.Content>
        <Tabs.Content value="images" class="no-scrollbar">
          <SettingsImages />
        </Tabs.Content>
        <Tabs.Content value="mcp" class="no-scrollbar">
          <SettingsMcp />
        </Tabs.Content>
        <Tabs.Content value="skills" class="no-scrollbar">
          <SettingsSkills />
        </Tabs.Content>
      </Tabs>
    </Dialog>
  )
}
