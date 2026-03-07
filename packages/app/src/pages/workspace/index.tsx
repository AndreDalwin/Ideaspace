import { Show, createSignal, createEffect, onMount } from "solid-js"
import { useNotebook } from "@/context/notebook"
import { WorkspaceSidebar } from "./sidebar"
import { MilkdownEditor } from "./editor"

let debounceTimer: ReturnType<typeof setTimeout> | undefined

export default function WorkspaceTab() {
  const nb = useNotebook()
  const [selectedNotebookID, setSelectedNotebookID] = createSignal<string>()
  const [selectedPageID, setSelectedPageID] = createSignal<string>()
  const [body, setBody] = createSignal("")

  const ensureDefault = async () => {
    if (nb.notebooks.length > 0) return
    const notebook = await nb.createNotebook("Commonplace")
    if (notebook) {
      const page = await nb.createPage(notebook.id, "Notes")
      if (page) {
        setSelectedNotebookID(notebook.id)
        setSelectedPageID(page.id)
        setBody("")
      }
    }
  }

  createEffect(() => {
    if (!nb.loading && nb.notebooks.length === 0) {
      void ensureDefault()
    }
  })

  createEffect(() => {
    if (!nb.loading && nb.notebooks.length > 0 && !selectedPageID()) {
      const first = nb.notebooks[0]
      const pages = nb.pages(first.id)
      if (pages.length > 0) {
        setSelectedNotebookID(first.id)
        setSelectedPageID(pages[0].id)
        setBody(pages[0].body ?? "")
      }
    }
  })

  const handleSelectPage = (notebookID: string, pageID: string) => {
    setSelectedNotebookID(notebookID)
    setSelectedPageID(pageID)
    const pages = nb.pages(notebookID)
    const page = pages.find((p) => p.id === pageID)
    setBody(page?.body ?? "")
  }

  const handleEditorChange = (value: string) => {
    setBody(value)
    const nbID = selectedNotebookID()
    const pgID = selectedPageID()
    if (!nbID || !pgID) return
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void nb.updatePage(nbID, pgID, { body: value })
    }, 500)
  }

  const selectedPage = () => {
    const nbID = selectedNotebookID()
    const pgID = selectedPageID()
    if (!nbID || !pgID) return undefined
    return nb.pages(nbID).find((p) => p.id === pgID)
  }

  return (
    <div class="grid h-full gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <div class="rounded-[18px] border border-border-weak-base bg-background-stronger p-4">
        <WorkspaceSidebar selectedPageID={selectedPageID()} onSelectPage={handleSelectPage} />
      </div>
      <div class="flex flex-col gap-3">
        <Show when={selectedPage()} fallback={<EmptyState />}>
          {(page) => (
            <>
              <div class="flex items-center gap-3">
                <h2 class="text-16-medium text-text-strong">{page().title}</h2>
                <span class="text-12-regular text-text-weak">
                  ~{Math.ceil((body().length || 0) / 3.5)} tokens
                </span>
              </div>
              <MilkdownEditor value={body()} onChange={handleEditorChange} />
            </>
          )}
        </Show>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div class="flex flex-col items-center justify-center gap-2 py-20">
      <div class="text-14-medium text-text-strong">Select a page to start editing</div>
      <div class="text-13-regular text-text-weak">Choose a page from the sidebar or create a new one.</div>
    </div>
  )
}
