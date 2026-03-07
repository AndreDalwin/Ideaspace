import { For, Show, createSignal } from "solid-js"
import { useNotebook } from "@/context/notebook"
import type { Notebook, Page } from "@opencode-ai/sdk/v2/client"

interface SidebarProps {
  selectedPageID: string | undefined
  onSelectPage: (notebookID: string, pageID: string) => void
}

export function WorkspaceSidebar(props: SidebarProps) {
  const nb = useNotebook()
  const [adding, setAdding] = createSignal<string | false>(false)
  const [newTitle, setNewTitle] = createSignal("")

  const handleAddPage = async (notebookID: string) => {
    const title = newTitle().trim()
    if (!title) return
    const page = await nb.createPage(notebookID, title)
    setAdding(false)
    setNewTitle("")
    if (page) props.onSelectPage(notebookID, page.id)
  }

  return (
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h3 class="text-12-medium uppercase tracking-[0.16em] text-text-weak">Notebooks</h3>
      </div>
      <For each={nb.notebooks}>
        {(notebook) => (
          <div class="flex flex-col gap-1">
            <div class="text-13-medium text-text-strong">{notebook.name}</div>
            <div class="flex flex-col gap-0.5 pl-2">
              <For each={nb.pages(notebook.id)}>
                {(page) => (
                  <button
                    class="rounded-lg px-2 py-1.5 text-left text-13-regular transition-colors"
                    classList={{
                      "bg-accent-primary/12 text-text-strong": props.selectedPageID === page.id,
                      "text-text-weak hover:bg-background-stronger hover:text-text-strong":
                        props.selectedPageID !== page.id,
                    }}
                    onClick={() => props.onSelectPage(notebook.id, page.id)}
                  >
                    {page.title}
                  </button>
                )}
              </For>
              <Show when={adding() === notebook.id}>
                <form
                  class="flex gap-1 pl-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleAddPage(notebook.id)
                  }}
                >
                  <input
                    autofocus
                    class="w-full rounded-lg border border-border-weak-base bg-background-base px-2 py-1 text-13-regular text-text-strong outline-none"
                    placeholder="Page title"
                    value={newTitle()}
                    onInput={(e) => setNewTitle(e.currentTarget.value)}
                    onBlur={() => {
                      setAdding(false)
                      setNewTitle("")
                    }}
                  />
                </form>
              </Show>
              <button
                class="rounded-lg px-2 py-1 text-left text-12-regular text-text-weak hover:text-text-strong"
                onClick={() => {
                  setAdding(notebook.id)
                  setNewTitle("")
                }}
              >
                + Add page
              </button>
            </div>
          </div>
        )}
      </For>
      <Show when={nb.notebooks.length === 0 && !nb.loading}>
        <p class="text-13-regular text-text-weak">No notebooks yet.</p>
      </Show>
    </div>
  )
}
