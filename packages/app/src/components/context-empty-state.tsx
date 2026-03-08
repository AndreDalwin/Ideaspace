import { useContextBank } from "@/context/context-bank"
import { EmptyState } from "./empty-state"

interface ContextEmptyStateProps {
  type: "files" | "sets"
}

export function ContextEmptyState(props: ContextEmptyStateProps) {
  const { actions } = useContextBank()

  if (props.type === "sets") {
    return (
      <EmptyState
        icon="📂"
        title="No context sets"
        description="Context sets let you organize related files together. Create a set to quickly switch between different contexts."
        primaryAction={{
          label: "Create Set",
          onClick: () => {},
        }}
      />
    )
  }

  return (
    <EmptyState
      icon="📁"
      title="No context files"
      description="Add files to your global context so the AI understands your project. These files will be included in every session."
      primaryAction={{
        label: "Add Files",
        onClick: () => {},
      }}
    />
  )
}
