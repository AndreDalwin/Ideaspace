import { createEffect, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import type { FileNode } from "@opencode-ai/sdk/v2"
import { useFile } from "../../context/file"

export type PlanFile = {
  path: string
  name: string
  modified: number
}

export function createWorkspaceState() {
  const file = useFile()
  const plansDir = () => ".ideaspace/plans"

  createEffect(() => {
    void file.tree.list(plansDir())
  })

  const planFiles = createMemo(() => {
    const nodes = file.tree.children(plansDir())
    const files: PlanFile[] = []
    for (const node of nodes) {
      if (node.type !== "file") continue
      if (!node.path.endsWith(".md")) continue
      const entry = node as FileNode & { modified?: number }
      files.push({
        path: node.path,
        name: node.name,
        modified: entry.modified ?? 0,
      })
    }
    return files.sort((a, b) => b.modified - a.modified)
  })

  const [state, setState] = createStore({
    selected: null as string | null,
    previousCount: 0,
  })

  createEffect(() => {
    const files = planFiles()
    const count = files.length
    let next: string | null = state.selected
    if (count === 0) {
      next = null
    } else {
      const newest = files[0].path
      if (!state.selected) next = newest
      else if (!files.some((plan) => plan.path === state.selected)) next = newest
      else if (count > state.previousCount) next = newest
    }
    if (next !== state.selected) setState("selected", next)
    if (state.previousCount !== count) setState("previousCount", count)
  })

  createEffect(() => {
    const path = state.selected
    if (!path) return
    void file.load(path)
  })

  const selectedContent = createMemo(() => {
    const path = state.selected
    if (!path) return null
    return file.get(path)?.content ?? null
  })

  return {
    planFiles,
    selected: () => state.selected,
    setSelected: (path: string | null) => setState("selected", path),
    selectedContent,
    refresh: () => file.tree.refresh(plansDir()),
  }
}
