import { createStore } from "solid-js/store"
import { createEffect, createMemo, createSignal, onMount } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useGlobalSync } from "@/context/global-sync"
import { useGlobalSDK } from "@/context/global-sdk"
import type { Agent, AgentConfig, Config } from "@opencode-ai/sdk/v2/client"

interface AgentsState {
  agents: Agent[]
  config: Config
  loading: boolean
  error: string | undefined
}

export const { use: useAgents, provider: AgentsProvider } = createSimpleContext({
  name: "Agents",
  init: () => {
    const sdk = useGlobalSDK()
    const globalSync = useGlobalSync()
    const [initialLoadComplete, setInitialLoadComplete] = createSignal(false)

    const [store, setStore] = createStore<AgentsState>({
      agents: [],
      config: {},
      loading: true,
      error: undefined,
    })

    const fetchAgents = async () => {
      try {
        const response = await sdk.client.app.agents({}, { throwOnError: true })
        setStore("agents", response.data ?? [])
      } catch (err) {
        setStore("error", err instanceof Error ? err.message : String(err))
      }
    }

    const fetchConfig = async () => {
      try {
        const response = await sdk.client.config.get({}, { throwOnError: true })
        setStore("config", response.data ?? {})
      } catch (err) {
        setStore("error", err instanceof Error ? err.message : String(err))
      }
    }

    const load = async () => {
      setStore("loading", true)
      setStore("error", undefined)
      await Promise.all([fetchAgents(), fetchConfig()])
      setStore("loading", false)
      setInitialLoadComplete(true)
    }

    onMount(() => {
      void load()
    })

    createEffect(() => {
      const globalConfig = globalSync.data.config
      if (globalConfig) {
        setStore("config", globalConfig)
      }
    })

    const list = createMemo(() => store.agents.filter((agent) => agent.hidden !== true))

    const primary = createMemo(() => list().filter((a) => a.mode === "primary" || a.mode === "all"))

    const subagents = createMemo(() => list().filter((a) => a.mode === "subagent" || a.mode === "all"))

    const get = (name: string) => {
      return store.agents.find((a) => a.name === name)
    }

    const getConfig = (name: string): AgentConfig | undefined => {
      return store.config.agent?.[name]
    }

    const update = async (name: string, config: Partial<AgentConfig>) => {
      const current = store.config.agent?.[name] ?? {}
      const next: AgentConfig = { ...current, ...config }

      const updated: Config = {
        ...store.config,
        agent: {
          ...store.config.agent,
          [name]: next,
        },
      }

      await globalSync.updateConfig(updated)
      setStore("config", "agent", name, next)
    }

    const remove = async (name: string) => {
      const agent = { ...store.config.agent }
      delete agent[name]

      const updated: Config = {
        ...store.config,
        agent,
      }

      await globalSync.updateConfig(updated)
      setStore("config", "agent", name, undefined)
    }

    return {
      get ready() {
        return initialLoadComplete()
      },
      get loading() {
        return store.loading
      },
      get error() {
        return store.error
      },
      get list() {
        return list()
      },
      get primary() {
        return primary()
      },
      get subagents() {
        return subagents()
      },
      get,
      getConfig,
      update,
      remove,
      reload: load,
    }
  },
})
