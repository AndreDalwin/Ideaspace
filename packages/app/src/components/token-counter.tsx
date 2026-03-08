import { createEffect, createSignal, Show } from "solid-js"
import { useSDK } from "@/context/sdk"

interface TokenCounterProps {
  sessionId?: string
}

export function TokenCounter(props: TokenCounterProps) {
  const sdk = useSDK()
  const [tokens, setTokens] = createSignal({ used: 0, max: 128000 })
  const [loading, setLoading] = createSignal(true)

  createEffect(async () => {
    if (!props.sessionId) {
      setLoading(false)
      return
    }

    try {
      // Placeholder for future backend call
      // const res = await sdk.client.session.tokens({ sessionId: props.sessionId })
      // if (res.data) {
      //   setTokens({ used: res.data.used, max: res.data.max })
      // }
      setTokens({ used: 0, max: 128000 })
    } catch (err) {
      console.error("Failed to load token count:", err)
    } finally {
      setLoading(false)
    }
  })

  const percentage = () => (tokens().used / tokens().max) * 100

  const formatTokens = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const getStatusColor = () => {
    const pct = percentage()
    if (pct > 90) return "text-surface-error-base"
    if (pct > 70) return "text-surface-warning-base"
    return "text-text-strong"
  }

  return (
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-stronger border border-border-weak-base max-w-[180px]">
      <span class="text-11-regular text-text-weak">Tokens:</span>

      <Show when={!loading()} fallback={<span class="text-11-medium text-text-weak">-- / --</span>}>
        <span class={`text-11-medium ${getStatusColor()}`}>
          {formatTokens(tokens().used)} / {formatTokens(tokens().max)}
        </span>

        <div class="flex-1">
          <div class="w-full h-1.5 bg-border-weak-base rounded-full overflow-hidden">
            <div
              class={`h-full rounded-full ${
                percentage() > 90
                  ? "bg-surface-error-base"
                  : percentage() > 70
                    ? "bg-surface-warning-base"
                    : "bg-surface-success-base"
              }`}
              style={{ width: `${Math.min(percentage(), 100)}%` }}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}
