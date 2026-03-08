import { useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useSkills } from "@/context/skills"
import { SkillEmptyState } from "@/components/skill-empty-state"
import { FadeIn, StaggerItem } from "@/components/transitions"
import type { JSX } from "solid-js"

export default function SkillsPage(): JSX.Element {
  const navigate = useNavigate()
  const { skills, deleteSkill } = useSkills()

  const handleEdit = (id: string) => {
    navigate(`/skills/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this skill?")) {
      deleteSkill(id)
    }
  }

  return (
    <div class="p-6 max-w-4xl mx-auto h-full">
      <FadeIn>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-semibold text-foreground">Skills</h1>
          <Button variant="primary" onClick={() => navigate("/skills/new")}>
            <Icon name="plus" class="w-4 h-4 mr-2" />
            New Skill
          </Button>
        </div>
      </FadeIn>

      {skills.length > 0 ? (
        <div class="grid gap-4">
          {skills.map((skill, idx) => (
            <StaggerItem index={idx}>
              <div class="flex items-start gap-4 p-4 bg-background-panel rounded-lg border border-border-base hover:border-border-hover transition-colors hover-lift">
                <div class="text-3xl">{skill.icon}</div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-foreground truncate">{skill.name}</h3>
                  <p class="text-sm text-foreground-muted mt-1">{skill.description}</p>
                  <div class="flex flex-wrap gap-2 mt-2">
                    {skill.defaultContext.map((ctx) => (
                      <span class="inline-flex items-center px-2 py-1 text-xs bg-background-base text-foreground-muted rounded">
                        {ctx}
                      </span>
                    ))}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="small" onClick={() => handleEdit(skill.id)}>
                    <Icon name="pencil-line" class="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => handleDelete(skill.id)}>
                    <Icon name="trash" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      ) : (
        <div class="flex items-center justify-center h-[calc(100%-80px)]">
          <SkillEmptyState />
        </div>
      )}
    </div>
  )
}
