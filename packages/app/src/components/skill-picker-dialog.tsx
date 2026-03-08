import { Button } from "@opencode-ai/ui/button"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { useNavigate, useParams } from "@solidjs/router"
import { For, createSignal } from "solid-js"
import { useSkills } from "@/context/skills"
import { useContextBank } from "@/context/context-bank"

interface SkillPickerDialogProps {
  onClose: () => void
}

export function SkillPickerDialog(props: SkillPickerDialogProps) {
  const skills = useSkills()
  const ctx = useContextBank()
  const navigate = useNavigate()
  const params = useParams()
  const dialog = useDialog()
  const [selectedId, setSelectedId] = createSignal<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId(id)
  }

  const handleConfirm = () => {
    const id = selectedId()
    if (!id) return

    const skill = skills.getSkill(id)
    if (!skill) return

    skill.defaultContext.forEach((path) => {
      ctx.actions.addToGlobal(path)
    })

    dialog.close()
    props.onClose()

    const dir = params.dir || "."
    navigate(`/${dir}/session?skill=${id}`)
  }

  const handleCancel = () => {
    dialog.close()
    props.onClose()
  }

  return (
    <Dialog title="Pick a Skill" class="w-full max-w-[520px] mx-auto">
      <div class="flex flex-col gap-4 p-6 pt-0">
        <p class="text-14-regular text-text-weak">
          Choose a pre-configured skill to get started. Each skill includes specific context files and instructions.
        </p>

        <div class="flex flex-col gap-2 max-h-[320px] overflow-auto">
          <For each={skills.skills}>
            {(skill) => {
              const isSelected = () => selectedId() === skill.id
              return (
                <button
                  onClick={() => handleSelect(skill.id)}
                  classList={{
                    "flex items-start gap-3 p-3 rounded-xl border text-left transition-all": true,
                    "border-accent-base bg-accent-base/10": isSelected(),
                    "border-border-weak-base hover:border-border-base bg-background-stronger": !isSelected(),
                  }}
                >
                  <span class="text-24 shrink-0">{skill.icon}</span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-15-semibold text-text-strong">{skill.name}</span>
                      {skill.defaultContext.length > 0 && (
                        <span class="text-11-regular text-text-weak shrink-0">
                          {skill.defaultContext.length} file{skill.defaultContext.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                    <p class="text-13-regular text-text-weak mt-0.5">{skill.description}</p>
                  </div>
                  {isSelected() && <Icon name="check" class="size-5 text-accent-base shrink-0" />}
                </button>
              )
            }}
          </For>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="large" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="large" disabled={!selectedId()} onClick={handleConfirm}>
            Start Session
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
