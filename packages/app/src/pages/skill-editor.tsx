import { useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { TextField } from "@opencode-ai/ui/text-field"
import { Icon } from "@opencode-ai/ui/icon"
import { useSkills } from "@/context/skills"
import type { SkillCreateInput } from "@/types/skill"
import { createEffect, createSignal, type JSX } from "solid-js"

export default function SkillEditorPage(): JSX.Element {
  const navigate = useNavigate()
  const params = useParams()
  const { getSkill, createSkill, updateSkill } = useSkills()

  const id = params.id
  const isNew = !id
  const skill = () => (isNew ? undefined : getSkill(id))

  const [form, setForm] = createSignal<SkillCreateInput>({
    name: "",
    icon: "",
    description: "",
    instructions: "",
    defaultContext: [],
  })

  const [contextInput, setContextInput] = createSignal("")

  createEffect(() => {
    const s = skill()
    if (s) {
      setForm({
        name: s.name,
        icon: s.icon,
        description: s.description,
        instructions: s.instructions,
        defaultContext: [...s.defaultContext],
      })
    }
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const data = form()

    if (isNew) {
      createSkill(data)
    } else {
      updateSkill({ id, ...data })
    }

    navigate("/skills")
  }

  const addContext = () => {
    const ctx = contextInput().trim()
    if (ctx && !form().defaultContext.includes(ctx)) {
      setForm((prev) => ({
        ...prev,
        defaultContext: [...prev.defaultContext, ctx],
      }))
      setContextInput("")
    }
  }

  const removeContext = (ctx: string) => {
    setForm((prev) => ({
      ...prev,
      defaultContext: prev.defaultContext.filter((c) => c !== ctx),
    }))
  }

  const cancel = () => navigate("/skills")

  return (
    <div class="p-6 max-w-2xl mx-auto">
      <div class="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="small" onClick={cancel}>
          <Icon name="arrow-left" class="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 class="text-2xl font-semibold text-foreground">{isNew ? "New Skill" : "Edit Skill"}</h1>
      </div>

      <form onSubmit={handleSubmit} class="space-y-6">
        <TextField
          label="Name"
          value={form().name}
          onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
          placeholder="e.g., Technical Writer"
          required
        />

        <TextField
          label="Icon (emoji)"
          value={form().icon}
          onChange={(v) => setForm((prev) => ({ ...prev, icon: v }))}
          placeholder="e.g., ✍️"
          maxLength={2}
          class="w-24"
        />

        <TextField
          label="Description"
          value={form().description}
          onChange={(v) => setForm((prev) => ({ ...prev, description: v }))}
          placeholder="Brief description of what this skill does"
          required
        />

        <TextField
          label="Instructions"
          multiline
          value={form().instructions}
          onChange={(v) => setForm((prev) => ({ ...prev, instructions: v }))}
          placeholder="Detailed instructions for the AI when using this skill..."
          required
        />
        <p class="text-sm text-foreground-muted -mt-4">
          These instructions tell the AI how to behave when this skill is active.
        </p>

        <div class="space-y-2">
          <label class="text-sm font-medium">Default Context Files</label>
          <div class="flex gap-2">
            <TextField
              value={contextInput()}
              onChange={setContextInput}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addContext()
                }
              }}
              placeholder="e.g., .ideaspace/style-guide.md"
            />
            <Button type="button" variant="secondary" onClick={addContext}>
              Add
            </Button>
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            {form().defaultContext.map((ctx) => (
              <span class="inline-flex items-center gap-1 px-2 py-1 text-sm bg-background-panel border border-border-base rounded">
                {ctx}
                <button
                  type="button"
                  onClick={() => removeContext(ctx)}
                  class="text-foreground-muted hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <Button type="submit" variant="primary">
            {isNew ? "Create Skill" : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
