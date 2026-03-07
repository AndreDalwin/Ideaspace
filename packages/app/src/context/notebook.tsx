import { createStore } from "solid-js/store"
import { onMount } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useSDK } from "@/context/sdk"
import type { Notebook, Page } from "@opencode-ai/sdk/v2/client"

interface NotebookState {
  notebooks: Notebook[]
  pages: Record<string, Page[]>
  loading: boolean
}

export const { use: useNotebook, provider: NotebookProvider } = createSimpleContext({
  name: "Notebook",
  gate: false,
  init: () => {
    const sdk = useSDK()
    const [store, setStore] = createStore<NotebookState>({
      notebooks: [],
      pages: {},
      loading: true,
    })

    const fetchNotebooks = async () => {
      const response = await sdk.client.notebook.list({}, { throwOnError: true })
      setStore("notebooks", response.data ?? [])
    }

    const fetchPages = async (notebookID: string) => {
      const response = await sdk.client.page.list({ notebookID }, { throwOnError: true })
      setStore("pages", notebookID, response.data ?? [])
    }

    const load = async () => {
      setStore("loading", true)
      await fetchNotebooks()
      for (const nb of store.notebooks) {
        await fetchPages(nb.id)
      }
      setStore("loading", false)
    }

    onMount(() => {
      void load()
    })

    const createNotebook = async (name: string, icon?: string) => {
      const response = await sdk.client.notebook.create({ name, icon }, { throwOnError: true })
      const nb = response.data
      if (nb) {
        setStore("notebooks", (prev) => [...prev, nb])
        setStore("pages", nb.id, [])
      }
      return nb
    }

    const updateNotebook = async (notebookID: string, data: { name?: string; icon?: string }) => {
      const response = await sdk.client.notebook.update({ notebookID, ...data }, { throwOnError: true })
      const nb = response.data
      if (nb) {
        setStore("notebooks", (n) => n.id === notebookID, nb)
      }
      return nb
    }

    const removeNotebook = async (notebookID: string) => {
      await sdk.client.notebook.remove({ notebookID }, { throwOnError: true })
      setStore("notebooks", (prev) => prev.filter((n) => n.id !== notebookID))
      setStore("pages", notebookID, undefined!)
    }

    const createPage = async (notebookID: string, title: string, body?: string) => {
      const response = await sdk.client.page.create({ notebookID, title, body }, { throwOnError: true })
      const page = response.data
      if (page) {
        setStore("pages", notebookID, (prev) => [...(prev ?? []), page])
      }
      return page
    }

    const updatePage = async (notebookID: string, pageID: string, data: { title?: string; body?: string }) => {
      const response = await sdk.client.page.update({ notebookID, pageID, ...data }, { throwOnError: true })
      const page = response.data
      if (page) {
        setStore("pages", notebookID, (p) => p.id === pageID, page)
      }
      return page
    }

    const removePage = async (notebookID: string, pageID: string) => {
      await sdk.client.page.remove({ notebookID, pageID }, { throwOnError: true })
      setStore("pages", notebookID, (prev) => (prev ?? []).filter((p) => p.id !== pageID))
    }

    return {
      get loading() {
        return store.loading
      },
      get notebooks() {
        return store.notebooks
      },
      pages: (notebookID: string) => store.pages[notebookID] ?? [],
      createNotebook,
      updateNotebook,
      removeNotebook,
      createPage,
      updatePage,
      removePage,
      reload: load,
    }
  },
})
