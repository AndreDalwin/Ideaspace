import path from "path"
import { Instance } from "../project/instance"
import { Filesystem } from "../util/filesystem"
import { Log } from "../util/log"

const log = Log.create({ service: "task-board" })

export type TaskStatus = "backlog" | "progress" | "review" | "done"

export type TaskSource = {
  plan: string
  key: string
}

export type TaskTime = {
  created: number
  updated: number
}

export type Task = {
  id: string
  title: string
  body: string
  deps: string[]
  status: TaskStatus
  position: number
  source: TaskSource
  time: TaskTime
}

export type TaskBoard = {
  version: 1
  columns: TaskStatus[]
  tasks: Task[]
}

const COLUMNS: TaskStatus[] = ["backlog", "progress", "review", "done"]

function boardPath(): string {
  return path.join(Instance.worktree, ".ideaspace", "tasks.json")
}

function generateId(): string {
  return `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function computeSourceKey(planPath: string, blockContent: string): string {
  // Simple hash for duplicate detection
  const str = `${planPath}:${blockContent.trim()}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export async function read(): Promise<TaskBoard> {
  const file = boardPath()
  try {
    const content = await Filesystem.readText(file)
    const parsed = JSON.parse(content) as TaskBoard
    if (parsed.version !== 1) {
      throw new Error(`Unsupported board version: ${parsed.version}`)
    }
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Initialize new board
      const board: TaskBoard = {
        version: 1,
        columns: COLUMNS,
        tasks: [],
      }
      await write(board)
      return board
    }
    throw error
  }
}

export async function write(board: TaskBoard): Promise<void> {
  const file = boardPath()
  await Filesystem.writeJson(file, board)
}

export async function save(board: TaskBoard): Promise<void> {
  // Update timestamps and persist
  const now = Date.now()
  for (const task of board.tasks) {
    task.time.updated = now
  }
  await write(board)
}

type ParsedTask = {
  title: string
  body: string
  id?: string
  deps: string[]
  checked: boolean
  sourceKey: string
}

function parsePlanContent(planPath: string, content: string): ParsedTask[] {
  const tasks: ParsedTask[] = []
  const lines = content.split("\n")

  let inTodos = false
  let currentTask: ParsedTask | null = null
  let blockContent = ""

  for (const line of lines) {
    const trimmed = line.trim()

    // Check for TODOs section
    if (trimmed.match(/^##\s+TODOs?/i)) {
      inTodos = true
      continue
    }

    // Exit TODOs section on next header
    if (inTodos && trimmed.startsWith("#")) {
      if (currentTask) {
        currentTask.sourceKey = computeSourceKey(planPath, blockContent)
        tasks.push(currentTask)
        currentTask = null
      }
      inTodos = false
      continue
    }

    if (!inTodos) continue

    // Parse checkbox line
    const checkboxMatch = trimmed.match(/^- \[([ x])\]\s*(.+)$/)
    if (checkboxMatch) {
      // Save previous task
      if (currentTask) {
        currentTask.sourceKey = computeSourceKey(planPath, blockContent)
        tasks.push(currentTask)
      }

      blockContent = line
      currentTask = {
        title: checkboxMatch[2].trim(),
        body: "",
        deps: [],
        checked: checkboxMatch[1] === "x",
        sourceKey: "",
      }
      continue
    }

    // Parse nested bullets under a task
    if (currentTask && trimmed.startsWith("- ")) {
      blockContent += "\n" + line
      const nestedContent = trimmed.slice(2).trim()

      // Parse metadata: id: xxx
      const idMatch = nestedContent.match(/^id:\s*(.+)$/)
      if (idMatch) {
        currentTask.id = idMatch[1].trim()
        continue
      }

      // Parse metadata: depends-on: xxx, yyy
      const depsMatch = nestedContent.match(/^depends-on:\s*(.+)$/)
      if (depsMatch) {
        currentTask.deps = depsMatch[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        continue
      }

      // Otherwise add to body
      if (currentTask.body) currentTask.body += "\n"
      currentTask.body += nestedContent
    }
  }

  // Don't forget the last task
  if (currentTask) {
    currentTask.sourceKey = computeSourceKey(planPath, blockContent)
    tasks.push(currentTask)
  }

  return tasks
}

export async function importFromPlan(planPath: string): Promise<{
  imported: number
  skipped: number
}> {
  const fullPath = path.join(Instance.worktree, planPath)
  const content = await Filesystem.readText(fullPath)
  const parsed = parsePlanContent(planPath, content)

  const board = await read()
  const existingKeys = new Set(board.tasks.map((t) => t.source.key))

  let imported = 0
  let skipped = 0
  const now = Date.now()

  for (const parsedTask of parsed) {
    if (existingKeys.has(parsedTask.sourceKey)) {
      skipped++
      continue
    }

    const task: Task = {
      id: parsedTask.id || generateId(),
      title: parsedTask.title,
      body: parsedTask.body,
      deps: parsedTask.deps,
      status: parsedTask.checked ? "done" : "backlog",
      position: board.tasks.filter((t) => t.status === (parsedTask.checked ? "done" : "backlog")).length,
      source: {
        plan: planPath,
        key: parsedTask.sourceKey,
      },
      time: {
        created: now,
        updated: now,
      },
    }

    board.tasks.push(task)
    imported++
  }

  if (imported > 0) {
    await write(board)
  }

  return { imported, skipped }
}

export * as TaskBoard from "./index"
