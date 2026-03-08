export interface Skill {
  id: string
  name: string
  icon: string
  description: string
  instructions: string
  defaultContext: string[]
  createdAt: number
  updatedAt: number
}

export interface SkillCreateInput {
  name: string
  icon: string
  description: string
  instructions: string
  defaultContext: string[]
}

export interface SkillUpdateInput extends Partial<SkillCreateInput> {
  id: string
}
