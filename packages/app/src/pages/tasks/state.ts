import { createStore, produce } from "solid-js/store"
import { createEffect, createMemo } from "solid-js"
import { useSDK } from "@/context/sdk"

export type TaskStatus = "backlog" | "progress" | "review" | "done"

export type Task = {
  id: string
  title: string
  body: string
  deps: string[]
  status: TaskStatus
  position: number
  source: {
    plan: string
    key: string
  }
  time: {
    created: number
    updated: number
  }
}

export type TaskBoard = {
  version: 1
  columns: TaskStatus[]
  tasks: Task[]
}

const COLUMNS: TaskStatus[] = ["backlog", "progress", "review", "done"]

export function createTasksState() {
  const sdk = useSDK()

  const [board, setBoard] = createStore<TaskBoard>({
    version: 1,
    columns: COLUMNS,
    tasks: [],
  })

  const [loading, setLoading] = createStore({
    initial: true,
    saving: false,
  })

  createEffect(() => {
    void load()
  })

  async function load() {
    try {
      const client = sdk.client as unknown as {
        get: <T>(opts: { url: string }) => Promise<{ data?: T }>
      }
      const res = await client.get<TaskBoard>({
        url: "/task-board",
      })
      if (res.data) {
        setBoard(res.data)
      }
    } finally {
      setLoading("initial", false)
    }
  }

  async function save() {
    setLoading("saving", true)
    try {
      const client = sdk.client as unknown as {
        patch: <T, E>(opts: { url: string; body: T; headers?: Record<string, string> }) => Promise<{ data?: T }>
      }
      const res = await client.patch<TaskBoard, unknown>({
        url: "/task-board",
        body: board,
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (res.data) {
        setBoard(res.data)
      }
    } finally {
      setLoading("saving", false)
    }
  }

  const columns = createMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      backlog: [],
      progress: [],
      review: [],
      done: [],
    }

    for (const task of board.tasks) {
      result[task.status].push(task)
    }

    for (const col of COLUMNS) {
      result[col].sort((a, b) => a.position - b.position)
    }

    return result
  })

  function isBlocked(task: Task): boolean {
    if (task.status === "done") return false
    if (task.deps.length === 0) return false

    for (const depId of task.deps) {
      const dep = board.tasks.find((t) => t.id === depId)
      if (!dep || dep.status !== "done") {
        return true
      }
    }
    return false
  }

  async function moveTask(taskId: string, newStatus: TaskStatus) {
    const task = board.tasks.find((t) => t.id === taskId)
    if (!task) return

    if (task.status === "backlog" && newStatus !== "backlog" && isBlocked(task)) {
      console.warn("Cannot move blocked task")
      return
    }

    setBoard(
      "tasks",
      (t) => t.id === taskId,
      produce((draft) => {
        draft.status = newStatus
        draft.position = board.tasks.filter((t) => t.status === newStatus).length
        draft.time.updated = Date.now()
      }),
    )

    await save()
  }

  return {
    board,
    columns,
    loading,
    isBlocked,
    moveTask,
    refresh: load,
  }
}
