import { createSimpleContext } from "@opencode-ai/ui/context"
import { createEffect, createMemo, on, onMount } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"

export const { use: useSettingsConfig, provider: SettingsConfigProvider } = createSimpleContext({
  name: "SettingsConfig",
  init: () => {
    const sdk = useGlobalSDK()
    const sync = useGlobalSync()

    type Mcp = NonNullable<Awaited<ReturnType<typeof sdk.client.settings.mcp.list>>["data"]>
    type McpInput = NonNullable<NonNullable<Parameters<typeof sdk.client.settings.mcp.create>[0]>["config"]>
    type Status = NonNullable<Awaited<ReturnType<typeof sdk.client.mcp.status>>["data"]>
    type Skill = NonNullable<Awaited<ReturnType<typeof sdk.client.app.skills>>["data"]>[number]

    const [store, setStore] = createStore({
      mcp: {} as Mcp,
      status: {} as Status,
      skills: [] as Skill[],
      loading: true,
      ready: false,
      error: undefined as string | undefined,
      pending: {} as Record<string, boolean>,
    })

    const clear = (key: string) => {
      setStore(
        "pending",
        produce((draft) => {
          delete draft[key]
        }),
      )
    }

    const fail = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      setStore("error", msg)
      return msg
    }

    const load = async () => {
      setStore("loading", true)
      setStore("error", undefined)

      try {
        const [mcp, status, skills] = await Promise.all([
          sdk.client.settings.mcp.list({}, { throwOnError: true }),
          sdk.client.mcp.status({}, { throwOnError: true }),
          sdk.client.app.skills({}, { throwOnError: true }),
        ])

        setStore("mcp", mcp.data ?? ({} as Mcp))
        setStore("status", status.data ?? ({} as Status))
        setStore("skills", skills.data ?? [])
      } catch (err) {
        fail(err)
      } finally {
        setStore("loading", false)
        setStore("ready", true)
      }
    }

    const run = async <T,>(key: string, fn: () => Promise<T>) => {
      setStore("pending", key, true)
      setStore("error", undefined)

      return fn()
        .catch((err) => {
          fail(err)
          throw err
        })
        .finally(() => {
          clear(key)
        })
    }

    const refresh = async () => {
      await Promise.all([sync.bootstrap(), load()])
    }

    const list = createMemo(() =>
      Object.entries(store.mcp)
        .map(([name, config]) => ({
          name,
          config,
          status: store.status[name],
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )

    const get = (name: string) => {
      const config = store.mcp[name]
      if (!config) return
      return {
        name,
        config,
        status: store.status[name],
      }
    }

    onMount(() => {
      void load()
    })

    createEffect(
      on(
        () => [sync.ready, sync.data.config] as const,
        ([ready]) => {
          if (!ready) return
          void load()
        },
        { defer: true },
      ),
    )

    return {
      get ready() {
        return store.ready
      },
      get loading() {
        return store.loading
      },
      get error() {
        return store.error
      },
      get skills() {
        return store.skills
      },
      get mcp() {
        return list()
      },
      get status() {
        return store.status
      },
      get pending() {
        return store.pending
      },
      pendingFor(key: string) {
        return !!store.pending[key]
      },
      get mutating() {
        return Object.keys(store.pending).length > 0
      },
      get,
      reload: load,
      mcpOps: {
        create(name: string, config: McpInput) {
          return run(`mcp:create:${name}`, async () => {
            await sdk.client.settings.mcp.create({ name, config }, { throwOnError: true })
            await refresh()
          })
        },
        update(name: string, config: McpInput) {
          return run(`mcp:update:${name}`, async () => {
            await sdk.client.settings.mcp.update({ name, config }, { throwOnError: true })
            await refresh()
          })
        },
        remove(name: string) {
          return run(`mcp:remove:${name}`, async () => {
            await sdk.client.settings.mcp.delete({ name }, { throwOnError: true })
            await refresh()
          })
        },
      },
      skillOps: {
        import(url: string) {
          return run(`skill:import:${url}`, async () => {
            await sdk.client.settings.skill.import({ settingsSkillUrl: { url } }, { throwOnError: true })
            await refresh()
          })
        },
        remove(url: string) {
          return run(`skill:remove:${url}`, async () => {
            await sdk.client.settings.skill.remove({ settingsSkillUrl: { url } }, { throwOnError: true })
            await refresh()
          })
        },
      },
    }
  },
})
