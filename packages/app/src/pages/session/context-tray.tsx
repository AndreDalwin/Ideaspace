import { For, Show, createSignal, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useSDK } from "@/context/sdk"
import { useContextBank } from "@/context/context-bank"
import type { ContextItem, SessionContext } from "@opencode-ai/sdk/v2/client"

interface ContextTrayProps {
  sessionID: string | undefined
}

export function ContextTray(props: ContextTrayProps) {
  const sdk = useSDK()
  const ctx = useContextBank()
  const [open, setOpen] = createSignal(false)
  const [store, setStore] = createStore<{ attached: SessionContext[]; loading: boolean }>({
    attached: [],
    loading: false,
  })

  const load = async () => {
    if (!props.sessionID) return
    setStore("loading", true)
    const items = await ctx.listSession(props.sessionID)
    setStore("attached", items)
    setStore("loading", false)
  }

  onMount(() => {
    if (props.sessionID) void load()
  })

  const isAttached = (contextID: string) => store.attached.some((a) => a.contextID === contextID)
  const isEnabled = (contextID: string) => store.attached.find((a) => a.contextID === contextID)?.enabled ?? false

  const totalTokens = () =>
    store.attached
      .filter((a) => a.enabled)
      .reduce((sum, a) => sum + (a.context?.tokens ?? 0), 0)

  const handleToggle = async (contextID: string) => {
    if (!props.sessionID) return
    if (isAttached(contextID)) {
      const current = isEnabled(contextID)
      await ctx.toggle(props.sessionID, contextID, !current)
    } else {
      await ctx.attach(props.sessionID, contextID)
    }
    await load()
  }

  const handleDetach = async (contextID: string) => {
    if (!props.sessionID) return
    await ctx.detach(props.sessionID, contextID)
    await load()
  }

  return (
    <div class="border-t border-border-weak-base">
      <button
        class="flex w-full items-center justify-between px-4 py-2 text-12-medium text-text-weak hover:text-text-strong"
        onClick={() => setOpen((v) => !v)}
      >
        <span>Context {store.attached.filter((a) => a.enabled).length > 0 && `(${store.attached.filter((a) => a.enabled).length})`}</span>
        <span class="flex items-center gap-2">
          <Show when={totalTokens() > 0}>
            <span class="text-11-regular">{totalTokens()} tokens</span>
          </Show>
          <span class="text-11-regular">{open() ? "v" : ">"}</span>
        </span>
      </button>
      <Show when={open()}>
        <div class="max-h-[300px] overflow-auto px-4 pb-3">
          <Show when={ctx.items.length > 0} fallback={<p class="text-12-regular text-text-weak py-2">No context items in project.</p>}>
            <div class="flex flex-col gap-1">
              <For each={ctx.items}>
                {(item) => (
                  <div class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background-stronger">
                    <button
                      class="size-4 shrink-0 rounded border text-center text-11-medium leading-4"
                      classList={{
                        "border-accent-primary bg-accent-primary text-black": isAttached(item.id) && isEnabled(item.id),
                        "border-border-strong-base text-transparent": !isAttached(item.id) || !isEnabled(item.id),
                      }}
                      onClick={() => handleToggle(item.id)}
                    >
                      {isAttached(item.id) && isEnabled(item.id) ? "v" : ""}
                    </button>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="text-12-medium text-text-strong truncate">{item.title}</span>
                        <Show when={item.pinned}>
                          <span class="text-10-regular text-accent-primary">pinned</span>
                        </Show>
                      </div>
                    </div>
                    <span class="text-11-regular text-text-weak shrink-0">{item.tokens ?? "?"} tok</span>
                    <Show when={isAttached(item.id)}>
                      <button
                        class="text-11-regular text-text-weak hover:text-red-400 shrink-0"
                        onClick={() => handleDetach(item.id)}
                      >
                        x
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
