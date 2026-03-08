import { createMemo, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useSkills } from "@/context/skills"
import { useContextBank } from "@/context/context-bank"
import type { Skill } from "@/types/skill"

interface WorkspaceContextIndicatorProps {
  skill?: Skill | undefined
  onClearSkill?: () => void
}

export function WorkspaceContextIndicator(props: WorkspaceContextIndicatorProps) {
  const ctx = useContextBank()

  const files = createMemo(() => {
    const paths = ctx.state.global.files
    return paths.length
  })

  const sets = createMemo(() => ctx.state.sets.length)

  const activeSkill = createMemo(() => props.skill)

  return (
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-stronger border border-border-weak-base">
      <Show when={activeSkill()} fallback={<EmptyState files={files()} sets={sets()} />}>
        {(skill) => <ActiveSkillState skill={skill()} files={files()} sets={sets()} onClear={props.onClearSkill} />}
      </Show>
    </div>
  )
}

function EmptyState(props: { files: number; sets: number }) {
  return (
    <>
      <Icon name="archive" class="size-4 text-text-weak" />
      <span class="text-13-regular text-text-weak">
        {props.files === 0 && props.sets === 0
          ? "No context"
          : `${props.files} file${props.files === 1 ? "" : "s"}, ${props.sets} set${props.sets === 1 ? "" : "s"}`}
      </span>
    </>
  )
}

function ActiveSkillState(props: { skill: Skill; files: number; sets: number; onClear?: () => void }) {
  return (
    <>
      <span class="text-16">{props.skill.icon}</span>
      <div class="flex flex-col">
        <span class="text-13-medium text-text-strong">{props.skill.name}</span>
        <span class="text-11-regular text-text-weak">
          {props.skill.defaultContext.length} file{props.skill.defaultContext.length === 1 ? "" : "s"}
        </span>
      </div>
      <div class="w-px h-4 bg-border-weak-base mx-1" />
      <span class="text-12-regular text-text-weak">
        {props.files} file{props.files === 1 ? "" : "s"}
      </span>
      <Button size="small" variant="ghost" class="ml-1 size-5 p-0" onClick={props.onClear}>
        <Icon name="close" class="size-3" />
      </Button>
    </>
  )
}
