import z from "zod"
import { Tool } from "./tool"
import * as TaskBoard from "../task-board"
import DESCRIPTION from "./task-update.txt"

type Metadata = {
  taskId: string
  taskTitle?: string
  oldStatus?: string
  newStatus?: string
  error?: boolean
  blocked?: boolean
  dependencies?: string[]
}

export const UpdateTaskTool = Tool.define("update_task", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      taskId: z.string().describe("The unique ID of the task to update (e.g., 'tsk_1234567890_abc123')"),
      status: z.enum(["backlog", "progress", "review", "done"]).describe("The new status for the task"),
    }),
    async execute(
      params,
      _ctx,
    ): Promise<{
      title: string
      output: string
      metadata: Metadata
    }> {
      try {
        const board = await TaskBoard.read()

        const idx = board.tasks.findIndex((t) => t.id === params.taskId)
        if (idx === -1) {
          return {
            title: "Task not found",
            output: `Could not find task with ID: ${params.taskId}`,
            metadata: { error: true, taskId: params.taskId },
          }
        }

        const task = board.tasks[idx]
        const old = task.status

        if (old === "backlog" && params.status !== "backlog") {
          const unresolved = task.deps.filter((id) => {
            const dep = board.tasks.find((t) => t.id === id)
            return !dep || dep.status !== "done"
          })

          if (unresolved.length > 0) {
            return {
              title: "Task blocked by dependencies",
              output: `Cannot move task "${task.title}" to ${params.status} because it has unresolved dependencies: ${unresolved.join(", ")}. Complete these tasks first.`,
              metadata: {
                error: true,
                blocked: true,
                taskId: params.taskId,
                dependencies: unresolved,
              },
            }
          }
        }

        board.tasks[idx] = {
          ...task,
          status: params.status,
          position: board.tasks.filter((t) => t.status === params.status).length,
          time: {
            ...task.time,
            updated: Date.now(),
          },
        }

        await TaskBoard.save(board)

        return {
          title: `Task moved to ${params.status}`,
          output: `Successfully moved task "${task.title}" from ${old} to ${params.status}. The Kanban board has been updated.`,
          metadata: {
            taskId: params.taskId,
            taskTitle: task.title,
            oldStatus: old,
            newStatus: params.status,
          },
        }
      } catch (error) {
        return {
          title: "Failed to update task",
          output: `Error updating task ${params.taskId}: ${error instanceof Error ? error.message : String(error)}`,
          metadata: {
            error: true,
            taskId: params.taskId,
          },
        }
      }
    },
  }
})
