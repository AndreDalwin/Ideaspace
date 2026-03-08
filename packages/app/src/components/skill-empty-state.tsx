import { useNavigate } from "@solidjs/router"
import { EmptyState } from "./empty-state"

export function SkillEmptyState() {
  const navigate = useNavigate()

  return (
    <EmptyState
      icon="🎨"
      title="No skills yet"
      description="Skills are pre-configured AI assistants that help you with specific tasks. Create your first skill to get started."
      primaryAction={{
        label: "Create Skill",
        onClick: () => navigate("/skills/new"),
      }}
      secondaryAction={{
        label: "Learn more",
        onClick: () => window.open("https://docs.ideaspace.dev/skills", "_blank"),
      }}
    />
  )
}
