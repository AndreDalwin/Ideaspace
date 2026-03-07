import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import z from "zod"
import { TaskBoard } from "../../task-board"
import { errors } from "../error"

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  deps: z.array(z.string()),
  status: z.enum(["backlog", "progress", "review", "done"]),
  position: z.number(),
  source: z.object({
    plan: z.string(),
    key: z.string(),
  }),
  time: z.object({
    created: z.number(),
    updated: z.number(),
  }),
})

const BoardSchema = z.object({
  version: z.literal(1),
  columns: z.array(z.enum(["backlog", "progress", "review", "done"])),
  tasks: z.array(TaskSchema),
})

const ImportRequestSchema = z.object({
  planPath: z.string(),
})

const ImportResponseSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
})

export function TaskBoardRoutes() {
  return new Hono()
    .get(
      "/",
      describeRoute({
        summary: "Get task board",
        description: "Read or initialize the task board from .ideaspace/tasks.json",
        operationId: "taskBoard.get",
        responses: {
          200: {
            description: "Task board data",
            content: {
              "application/json": {
                schema: resolver(BoardSchema),
              },
            },
          },
          ...errors(500),
        },
      }),
      async (c) => {
        const board = await TaskBoard.read()
        return c.json(board)
      },
    )
    .post(
      "/import",
      describeRoute({
        summary: "Import tasks from plan",
        description: "Import tasks from a plan file into the task board",
        operationId: "taskBoard.import",
        responses: {
          200: {
            description: "Import result",
            content: {
              "application/json": {
                schema: resolver(ImportResponseSchema),
              },
            },
          },
          ...errors(400, 500),
        },
      }),
      validator("json", ImportRequestSchema),
      async (c) => {
        const { planPath } = c.req.valid("json")
        const result = await TaskBoard.importFromPlan(planPath)
        return c.json(result)
      },
    )
    .patch(
      "/",
      describeRoute({
        summary: "Update task board",
        description: "Save board state after move or edit",
        operationId: "taskBoard.patch",
        responses: {
          200: {
            description: "Updated board",
            content: {
              "application/json": {
                schema: resolver(BoardSchema),
              },
            },
          },
          ...errors(400, 500),
        },
      }),
      validator("json", BoardSchema),
      async (c) => {
        const board = c.req.valid("json")
        await TaskBoard.save(board)
        return c.json(board)
      },
    )
}
