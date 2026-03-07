import { createStore } from "solid-js/store"
import { onMount } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useSDK } from "@/context/sdk"
import type { ContextItem, SessionContext } from "@opencode-ai/sdk/v2/client"

interface ContextBankState {
  items: ContextItem[]
  loading: boolean
}

export const { use: useContextBank, provider: ContextBankProvider } = createSimpleContext({
  name: "ContextBank",
  gate: false,
  init: () => {
    const sdk = useSDK()
    const [store, setStore] = createStore<ContextBankState>({
      items: [],
      loading: true,
    })

    const load = async () => {
      setStore("loading", true)
      const response = await sdk.client.context.list({}, { throwOnError: true })
      setStore("items", response.data ?? [])
      setStore("loading", false)
    }

    onMount(() => {
      void load()
    })

    const create = async (data: { kind: string; title: string; body?: string; refID?: string; pinned?: boolean }) => {
      const response = await sdk.client.context.create(data, { throwOnError: true })
      const item = response.data
      if (item) setStore("items", (prev) => [...prev, item])
      return item
    }

    const update = async (
      contextID: string,
      data: { title?: string; body?: string; pinned?: boolean; security?: string },
    ) => {
      const response = await sdk.client.context.update({ contextID, ...data }, { throwOnError: true })
      const item = response.data
      if (item) setStore("items", (i) => i.id === contextID, item)
      return item
    }

    const remove = async (contextID: string) => {
      await sdk.client.context.remove({ contextID }, { throwOnError: true })
      setStore("items", (prev) => prev.filter((i) => i.id !== contextID))
    }

    const listSession = async (sessionID: string) => {
      const response = await sdk.client.session.context.list({ sessionID }, { throwOnError: true })
      return (response.data ?? []) as SessionContext[]
    }

    const attach = async (sessionID: string, contextID: string) => {
      await sdk.client.session.context.attach({ sessionID, contextID }, { throwOnError: true })
    }

    const detach = async (sessionID: string, contextID: string) => {
      await sdk.client.session.context.detach({ sessionID, contextID }, { throwOnError: true })
    }

    const toggle = async (sessionID: string, contextID: string, enabled: boolean) => {
      await sdk.client.session.context.toggle({ sessionID, contextID, enabled }, { throwOnError: true })
    }

    return {
      get loading() {
        return store.loading
      },
      get items() {
        return store.items
      },
      create,
      update,
      remove,
      listSession,
      attach,
      detach,
      toggle,
      reload: load,
    }
  },
})
