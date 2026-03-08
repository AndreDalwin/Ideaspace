import "@/index.css"
import { File } from "@opencode-ai/ui/file"
import { I18nProvider } from "@opencode-ai/ui/context"
import { DialogProvider } from "@opencode-ai/ui/context/dialog"
import { FileComponentProvider } from "@opencode-ai/ui/context/file"
import { MarkedProvider } from "@opencode-ai/ui/context/marked"
import { Font } from "@opencode-ai/ui/font"
import { ThemeProvider } from "@opencode-ai/ui/theme"
import { MetaProvider } from "@solidjs/meta"
import { BaseRouterProps, Navigate, Route, Router, useParams } from "@solidjs/router"
import { Component, ErrorBoundary, type JSX, lazy, type ParentProps, Show, Suspense } from "solid-js"

import { CommandProvider } from "@/context/command"
import { ContextBankProvider } from "@/context/context-bank"
import { SkillsProvider } from "@/context/skills"
import { FileProvider } from "@/context/file"
import { GlobalSDKProvider } from "@/context/global-sdk"
import { GlobalSyncProvider } from "@/context/global-sync"
import { HighlightsProvider } from "@/context/highlights"
import { LanguageProvider, useLanguage } from "@/context/language"
import { LayoutProvider } from "@/context/layout"
import { ModelsProvider } from "@/context/models"
import { NotificationProvider } from "@/context/notification"
import { PermissionProvider } from "@/context/permission"
import { usePlatform } from "@/context/platform"
import { type ServerConnection, ServerProvider, useServer } from "@/context/server"
import { SettingsProvider } from "@/context/settings"
import DirectoryLayout from "@/pages/directory-layout"
import Layout from "@/pages/layout"
import { ErrorPage } from "./pages/error"
import { Dynamic } from "solid-js/web"

const Home = lazy(() => import("@/pages/home"))
const Project = lazy(() => import("@/pages/project"))
const Session = lazy(() => import("@/pages/session"))
const Agents = lazy(() => import("@/pages/agents"))
const UnifiedWorkspace = lazy(() => import("@/pages/unified-workspace"))
const V3Layout = lazy(() => import("@/layouts/v3-layout"))
const V3BlankWorkspace = lazy(() => import("@/components/v3-blank-workspace"))
const V3Tasks = lazy(() => import("@/pages/v3-tasks"))
const SkillsPage = lazy(() => import("@/pages/skills"))
const SkillEditorPage = lazy(() => import("@/pages/skill-editor"))
const Loading = () => <div class="size-full" />

const HomeRoute = () => (
  <Suspense fallback={<Loading />}>
    <Home />
  </Suspense>
)

const ProjectRoute = () => (
  <FileProvider>
    <Suspense fallback={<Loading />}>
      <Project />
    </Suspense>
  </FileProvider>
)

const AgentsRoute = () => (
  <AgentsProvider>
    <Suspense fallback={<Loading />}>
      <Agents />
    </Suspense>
  </AgentsProvider>
)

const UnifiedWorkspaceRoute = () => (
  <FileProvider>
    <Suspense fallback={<Loading />}>
      <UnifiedWorkspace />
    </Suspense>
  </FileProvider>
)

const V3Route = () => (
  <Suspense fallback={<Loading />}>
    <V3Layout>
      <V3BlankWorkspace />
    </V3Layout>
  </Suspense>
)

const SkillsRoute = () => (
  <Suspense fallback={<Loading />}>
    <V3Layout>
      <SkillsPage />
    </V3Layout>
  </Suspense>
)

const V3TasksRoute = () => (
  <Suspense fallback={<Loading />}>
    <V3Layout>
      <V3Tasks />
    </V3Layout>
  </Suspense>
)

const SkillEditorRoute = () => (
  <Suspense fallback={<Loading />}>
    <V3Layout>
      <SkillEditorPage />
    </V3Layout>
  </Suspense>
)

const SessionIndexRoute = () => {
  const params = useParams()
  const dir = params.dir
  const target = dir ? `/${dir}/session` : "/session"
  return <Navigate href={target} />
}

function UiI18nBridge(props: ParentProps) {
  const language = useLanguage()
  return <I18nProvider value={{ locale: language.locale, t: language.t }}>{props.children}</I18nProvider>
}

declare global {
  type IdeaspaceBoot = {
    updaterEnabled?: boolean
    deepLinks?: string[]
    wsl?: boolean
  }

  interface Window {
    __IDEASPACE__?: IdeaspaceBoot
  }
}

function MarkedProviderWithNativeParser(props: ParentProps) {
  const platform = usePlatform()
  return <MarkedProvider nativeParser={platform.parseMarkdown}>{props.children}</MarkedProvider>
}

function AppShellProviders(props: ParentProps) {
  return (
    <SettingsProvider>
      <PermissionProvider>
        <LayoutProvider>
          <NotificationProvider>
            <ModelsProvider>
              <ContextBankProvider>
                <SkillsProvider>
                  <CommandProvider>
                    <HighlightsProvider>
                      <Layout>{props.children}</Layout>
                    </HighlightsProvider>
                  </CommandProvider>
                </SkillsProvider>
              </ContextBankProvider>
            </ModelsProvider>
          </NotificationProvider>
        </LayoutProvider>
      </PermissionProvider>
    </SettingsProvider>
  )
}

function RouterRoot(props: ParentProps<{ appChildren?: JSX.Element }>) {
  return (
    <AppShellProviders>
      {props.appChildren}
      {props.children}
    </AppShellProviders>
  )
}

export function AppBaseProviders(props: ParentProps) {
  return (
    <MetaProvider>
      <Font />
      <ThemeProvider>
        <LanguageProvider>
          <UiI18nBridge>
            <ErrorBoundary fallback={(error) => <ErrorPage error={error} />}>
              <DialogProvider>
                <MarkedProviderWithNativeParser>
                  <FileComponentProvider component={File}>{props.children}</FileComponentProvider>
                </MarkedProviderWithNativeParser>
              </DialogProvider>
            </ErrorBoundary>
          </UiI18nBridge>
        </LanguageProvider>
      </ThemeProvider>
    </MetaProvider>
  )
}

function ServerKey(props: ParentProps) {
  const server = useServer()
  return (
    <Show when={server.key} keyed>
      {props.children}
    </Show>
  )
}

export function AppInterface(props: {
  children?: JSX.Element
  defaultServer: ServerConnection.Key
  servers?: Array<ServerConnection.Any>
  router?: Component<BaseRouterProps>
}) {
  return (
    <ServerProvider defaultServer={props.defaultServer} servers={props.servers}>
      <ServerKey>
        <GlobalSDKProvider>
          <GlobalSyncProvider>
            <Dynamic
              component={props.router ?? Router}
              root={(routerProps) => <RouterRoot appChildren={props.children}>{routerProps.children}</RouterRoot>}
            >
              <Route path="/" component={HomeRoute} />
              <Route path="/agents" component={AgentsRoute} />
              <Route path="/skills" component={SkillsRoute} />
              <Route path="/skills/new" component={SkillEditorRoute} />
              <Route path="/skills/:id/edit" component={SkillEditorRoute} />
              <Route path="/tasks" component={V3TasksRoute} />
              <Route path="/:dir" component={DirectoryLayout}>
                <Route path="/" component={UnifiedWorkspaceRoute} />
                <Route path="/workspace" component={UnifiedWorkspaceRoute} />
                <Route path="/tasks" component={UnifiedWorkspaceRoute} />
                <Route path="/agents" component={ProjectRoute} />
                <Route path="/context" component={ProjectRoute} />
                <Route path="/session/:id?" component={UnifiedWorkspaceRoute} />
                <Route path="/v3" component={V3Route} />
              </Route>
            </Dynamic>
          </GlobalSyncProvider>
        </GlobalSDKProvider>
      </ServerKey>
    </ServerProvider>
  )
}
