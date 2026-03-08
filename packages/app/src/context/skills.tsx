import { createContext, useContext, ParentProps } from "solid-js"
import { createStore } from "solid-js/store"
import type { Skill, SkillCreateInput, SkillUpdateInput } from "@/types/skill"

interface SkillsContextValue {
  skills: Skill[]
  getSkill: (id: string) => Skill | undefined
  createSkill: (input: SkillCreateInput) => Skill
  updateSkill: (input: SkillUpdateInput) => void
  deleteSkill: (id: string) => void
}

const SkillsContext = createContext<SkillsContextValue>()

export function SkillsProvider(props: ParentProps) {
  const [skills, setSkills] = createStore<Skill[]>([
    {
      id: "write",
      name: "Write Content",
      icon: "✍️",
      description: "Technical writing and documentation",
      instructions:
        "You are a technical writer. Help create clear, engaging content following the project's style guide.",
      defaultContext: [".ideaspace/style-guide.md"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "review",
      name: "Code Review",
      icon: "👨‍💻",
      description: "Review and improve code",
      instructions: "You are a senior developer. Review code for bugs, performance, and best practices.",
      defaultContext: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: "plan",
      name: "Project Plan",
      icon: "📊",
      description: "Plan and organize work",
      instructions: "You are a project manager. Help break down work into actionable tasks.",
      defaultContext: [".ideaspace/templates/plan.md"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ])

  const getSkill = (id: string) => skills.find((s) => s.id === id)

  const createSkill = (input: SkillCreateInput): Skill => {
    const skill: Skill = {
      id: `skill_${Date.now()}`,
      ...input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSkills((prev) => [...prev, skill])
    return skill
  }

  const updateSkill = (input: SkillUpdateInput) => {
    setSkills((s) => s.id === input.id, { ...input, updatedAt: Date.now() })
  }

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <SkillsContext.Provider value={{ skills, getSkill, createSkill, updateSkill, deleteSkill }}>
      {props.children}
    </SkillsContext.Provider>
  )
}

export function useSkills() {
  const context = useContext(SkillsContext)
  if (!context) throw new Error("useSkills must be used within SkillsProvider")
  return context
}
