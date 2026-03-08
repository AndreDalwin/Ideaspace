import { type JSX, type ParentProps, Show } from "solid-js"

interface EmptyStateProps extends ParentProps {
  icon: string
  title: string
  description?: string
  primaryAction?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState(props: EmptyStateProps): JSX.Element {
  return (
    <div class="flex flex-col items-center justify-center text-center p-8 animate-fade-in">
      <div class="text-48 animate-bounce-subtle">{props.icon}</div>
      <h3 class="text-18-semibold text-text-strong mt-4">{props.title}</h3>
      <Show when={props.description}>
        <p class="text-14-regular text-text-weak mt-2 max-w-sm">{props.description}</p>
      </Show>
      <Show when={props.primaryAction || props.secondaryAction}>
        <div class="flex items-center gap-3 mt-6">
          <Show when={props.secondaryAction}>
            <button
              onClick={props.secondaryAction!.onClick}
              class="px-4 py-2 rounded-lg text-14-medium text-text-weak hover:text-text-strong hover:bg-background-stronger transition-colors"
            >
              {props.secondaryAction!.label}
            </button>
          </Show>
          <Show when={props.primaryAction}>
            <button
              onClick={props.primaryAction!.onClick}
              class="px-4 py-2 rounded-lg text-14-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
            >
              {props.primaryAction!.label}
            </button>
          </Show>
        </div>
      </Show>
      {props.children}
    </div>
  )
}
