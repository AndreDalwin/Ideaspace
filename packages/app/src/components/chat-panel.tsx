import { For, Show, createSignal, createMemo, type Accessor } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { createMediaQuery } from "@solid-primitives/media"
import { ResizeHandle } from "@opencode-ai/ui/resize-handle"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ScrollView } from "@opencode-ai/ui/scroll-view"
export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export type ChatPanelProps = {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  onClose?: () => void
  onSend?: (content: string) => Promise<string> | string
  messages?: Accessor<ChatMessage[]>
  loading?: Accessor<boolean>
  class?: string
}

export function ChatPanel(props: ChatPanelProps) {
  const isDesktop = createMediaQuery("(min-width: 768px)")
  const [width, setWidth] = createSignal(props.initialWidth ?? 320)

  const [localState, setLocalState] = createStore({
    input: "",
    sending: false,
    messages: [] as ChatMessage[],
  })

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

  const allMessages = createMemo(() => props.messages?.() ?? localState.messages)
  const isLoading = createMemo(() => props.loading?.() ?? localState.sending)

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading()) return

    const trimmed = content.trim()
    setLocalState("input", "")

    if (props.onSend) {
      setLocalState("sending", true)
      try {
        const response = await props.onSend(trimmed)
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        }
        setLocalState(
          produce((draft) => {
            draft.messages.push(assistantMessage)
            draft.sending = false
          }),
        )
      } catch {
        setLocalState("sending", false)
      }
    } else {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      }
      setLocalState(
        produce((draft) => {
          draft.messages.push(userMessage)
        }),
      )
    }
  }

  const handleSubmit = () => {
    const content = localState.input.trim()
    if (content) void sendMessage(content)
  }

  const messageGroups = createMemo(() => {
    const list = allMessages()
    const groups: { role: "user" | "assistant"; messages: ChatMessage[] }[] = []
    let currentGroup: { role: "user" | "assistant"; messages: ChatMessage[] } | null = null

    for (const message of list) {
      if (!currentGroup || currentGroup.role !== message.role) {
        currentGroup = { role: message.role, messages: [] }
        groups.push(currentGroup)
      }
      currentGroup.messages.push(message)
    }

    return groups
  })

  return (
    <Show when={isDesktop()}>
      <aside
        class={`relative h-full border-l border-border-weaker-base flex flex-col bg-background-stronger ${props.class ?? ""}`}
        style={{ width: `${width()}px` }}
      >
        <div class="flex items-center justify-between px-3 py-2 border-b border-border-weaker-base">
          <span class="text-14-medium text-text-strong">Chat</span>
          <Show when={props.onClose}>
            <IconButton
              icon="close-small"
              variant="ghost"
              size="small"
              onClick={props.onClose}
              aria-label="Close chat"
            />
          </Show>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden">
          <ScrollView class="h-full">
            <div class="flex flex-col gap-4 p-3">
              <Show
                when={allMessages().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center py-12 text-center">
                    <div class="text-12-regular text-text-weak">Start a conversation...</div>
                  </div>
                }
              >
                <For each={messageGroups()}>
                  {(group) => (
                    <div class={`flex ${group.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        class={`max-w-[85%] rounded-lg px-3 py-2 ${
                          group.role === "user"
                            ? "bg-primary-base text-primary-contrast"
                            : "bg-background-base text-text-strong border border-border-weak-base"
                        }`}
                      >
                        <For each={group.messages}>
                          {(message) => (
                            <div class="text-13-regular whitespace-pre-wrap break-words">{message.content}</div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
                <Show when={isLoading()}>
                  <div class="flex justify-start">
                    <div class="bg-background-base border border-border-weak-base rounded-lg px-3 py-2">
                      <div class="flex items-center gap-2 text-text-weak">
                        <div class="size-4 animate-spin rounded-full border-2 border-border-strong-base border-t-primary-base" />
                        <span class="text-12-regular">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </Show>
              </Show>
            </div>
          </ScrollView>
        </div>

        <div class="shrink-0 border-t border-border-weaker-base p-3">
          <div class="flex gap-2">
            <input
              type="text"
              value={localState.input}
              onInput={(e) => setLocalState("input", e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Type a message..."
              disabled={isLoading()}
              class="flex-1 min-w-0 px-3 py-2 text-13-regular bg-background-base border border-border-weak-base rounded-md text-text-strong placeholder:text-text-weak focus:outline-none focus:border-border-strong-base focus:ring-1 focus:ring-primary-base disabled:opacity-50"
            />
            <IconButton
              icon="arrow-up"
              variant="primary"
              size="large"
              onClick={handleSubmit}
              disabled={!localState.input.trim() || isLoading()}
              aria-label="Send message"
            />
          </div>
        </div>

        <ResizeHandle
          direction="horizontal"
          edge="start"
          size={width()}
          min={props.minWidth ?? 280}
          max={props.maxWidth ?? 480}
          collapseThreshold={200}
          onResize={setWidth}
          onCollapse={props.onClose}
        />
      </aside>
    </Show>
  )
}
