import { For, Show, createSignal } from "solid-js"
import { useContextBank } from "@/context/context-bank"
import type { ContextItem } from "@opencode-ai/sdk/v2/client"

export default function ContextTab() {
  const ctx = useContextBank()
  const [creating, setCreating] = createSignal(false)
  const [form, setForm] = createSignal({ title: "", body: "", kind: "bank" as string })

  const handleCreate = async () => {
    const { title, body, kind } = form()
    if (!title.trim()) return
    await ctx.create({ kind, title: title.trim(), body: body.trim() || undefined, pinned: false })
    setCreating(false)
    setForm({ title: "", body: "", kind: "bank" })
  }

  const handleTogglePin = async (item: ContextItem) => {
    await ctx.update(item.id, { pinned: !item.pinned })
  }

  const pinned = () => ctx.items.filter((i) => i.pinned)
  const unpinned = () => ctx.items.filter((i) => !i.pinned)

  return (
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-16-medium text-text-strong">Context bank</h2>
            <p class="text-13-regular text-text-weak">Knowledge base for AI sessions</p>
          </div>
          <button
            class="rounded-xl border border-border-strong-base px-3 py-1.5 text-12-medium text-text-strong hover:bg-background-base"
            onClick={() => setCreating(true)}
          >
            + Add item
          </button>
        </div>

        <Show when={creating()}>
          <form
            class="mb-4 flex flex-col gap-2 rounded-2xl border border-border-weak-base bg-background-base p-4"
            onSubmit={(e) => {
              e.preventDefault()
              void handleCreate()
            }}
          >
            <input
              autofocus
              class="rounded-lg border border-border-weak-base bg-background-stronger px-3 py-2 text-13-regular text-text-strong outline-none"
              placeholder="Title"
              value={form().title}
              onInput={(e) => setForm((f) => ({ ...f, title: e.currentTarget.value }))}
            />
            <textarea
              class="rounded-lg border border-border-weak-base bg-background-stronger px-3 py-2 text-13-regular text-text-strong outline-none min-h-[80px] resize-y"
              placeholder="Content (optional)"
              value={form().body}
              onInput={(e) => setForm((f) => ({ ...f, body: e.currentTarget.value }))}
            />
            <div class="flex gap-2">
              <select
                class="rounded-lg border border-border-weak-base bg-background-stronger px-2 py-1 text-12-regular text-text-strong"
                value={form().kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.currentTarget.value }))}
              >
                <option value="bank">Bank</option>
                <option value="snippet">Snippet</option>
              </select>
              <button type="submit" class="rounded-lg bg-accent-primary px-3 py-1 text-12-medium text-black">
                Create
              </button>
              <button
                type="button"
                class="rounded-lg border border-border-weak-base px-3 py-1 text-12-medium text-text-weak"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Show>

        <div class="flex flex-col gap-2">
          <For each={unpinned()} fallback={<Show when={!ctx.loading && pinned().length === 0}><p class="text-13-regular text-text-weak py-8 text-center">No context items yet. Add one to get started.</p></Show>}>
            {(item) => <ContextRow item={item} onTogglePin={handleTogglePin} onRemove={ctx.remove} />}
          </For>
        </div>
      </section>

      <section class="rounded-[18px] border border-border-weak-base bg-background-stronger p-5">
        <div class="mb-4">
          <h2 class="text-16-medium text-text-strong">Pinned</h2>
          <p class="text-13-regular text-text-weak">Always included in AI sessions</p>
        </div>
        <div class="flex flex-col gap-2">
          <For each={pinned()} fallback={<p class="text-13-regular text-text-weak py-8 text-center">Pin items to always include them in AI conversations.</p>}>
            {(item) => <ContextRow item={item} onTogglePin={handleTogglePin} onRemove={ctx.remove} />}
          </For>
        </div>
      </section>
    </div>
  )
}

function ContextRow(props: {
  item: ContextItem
  onTogglePin: (item: ContextItem) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const kindColor: Record<string, string> = {
    page: "bg-accent-primary/12 text-accent-primary",
    bank: "bg-surface-info-base/18 text-text-strong",
    snippet: "bg-surface-warning-base/18 text-text-strong",
    file: "bg-surface-success-base/18 text-text-strong",
  }

  return (
    <div class="group flex items-center gap-3 rounded-2xl border border-border-weak-base bg-background-base p-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class={`inline-flex rounded-full px-2 py-0.5 text-11-medium ${kindColor[props.item.kind] ?? kindColor.bank}`}>
            {props.item.kind}
          </span>
          <span class="text-14-medium text-text-strong truncate">{props.item.title}</span>
        </div>
        <Show when={props.item.body}>
          <div class="mt-1 text-12-regular text-text-weak line-clamp-1">{props.item.body}</div>
        </Show>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Show when={props.item.tokens}>
          <span class="text-11-regular text-text-weak">{props.item.tokens} tok</span>
        </Show>
        <button
          class="text-12-regular text-text-weak hover:text-accent-primary"
          onClick={() => props.onTogglePin(props.item)}
        >
          {props.item.pinned ? "Unpin" : "Pin"}
        </button>
        <Show when={props.item.kind !== "page"}>
          <button
            class="text-12-regular text-text-weak opacity-0 hover:text-red-400 group-hover:opacity-100"
            onClick={() => props.onRemove(props.item.id)}
          >
            x
          </button>
        </Show>
      </div>
    </div>
  )
}
