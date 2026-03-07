import { createStore } from "solid-js/store"
import { createMemo, onMount } from "solid-js"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { useSDK } from "@/context/sdk"
import type { Task } from "@opencode-ai/sdk/v2/client"

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
] as const

interface TaskBoardState {
  tasks: Task[]
  loading: boolean
}

export const { use: useTaskBoard, provider: TaskBoardProvider } = createSimpleContext({
  name: "TaskBoard",
  gate: false,
  init: () => {
    const sdk = useSDK()
    const [store, setStore] = createStore<TaskBoardState>({
      tasks: [],
      loading: true,
    })

    const load = async () => {
      setStore("loading", true)
      const response = await sdk.client.task.list({}, { throwOnError: true })
      setStore("tasks", response.data ?? [])
      setStore("loading", false)
    }

    onMount(() => {
      void load()
    })

    const byStatus = (status: string) => store.tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)

    const create = async (data: { title: string; body?: string; status?: string; priority?: string }) => {
      const response = await sdk.client.task.create(data, { throwOnError: true })
      const task = response.data
      if (task) setStore("tasks", (prev) => [...prev, task])
      return task
    }

    const update = async (taskID: string, data: { title?: string; body?: string; status?: string; priority?: string }) => {
      const response = await sdk.client.task.update({ taskID, ...data }, { throwOnError: true })
      const task = response.data
      if (task) setStore("tasks", (t) => t.id === taskID, task)
      return task
    }

    const move = async (taskID: string, status: string, position: number) => {
      const response = await sdk.client.task.move({ taskID, status, position }, { throwOnError: true })
      const task = response.data
      if (task) setStore("tasks", (t) => t.id === taskID, task)
      return task
    }

    const remove = async (taskID: string) => {
      await sdk.client.task.remove({ taskID }, { throwOnError: true })
      setStore("tasks", (prev) => prev.filter((t) => t.id !== taskID))
    }

    return {
      get loading() {
        return store.loading
      },
      get tasks() {
        return store.tasks
      },
      columns: COLUMNS,
      byStatus,
      create,
      update,
      move,
      remove,
      reload: load,
    }
  },
})
