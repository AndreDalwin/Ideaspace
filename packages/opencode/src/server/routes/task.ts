import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { Task } from "../../task"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const TaskRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List tasks",
        description: "List all tasks in the current project.",
        operationId: "task.list",
        responses: {
          200: {
            description: "List of tasks",
            content: {
              "application/json": {
                schema: resolver(Task.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(Task.list())
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create task",
        description: "Create a new task in the current project.",
        operationId: "task.create",
        responses: {
          200: {
            description: "Created task",
            content: {
              "application/json": {
                schema: resolver(Task.Info),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator(
        "json",
        z.object({
          title: z.string(),
          body: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assigneeKind: z.string().optional(),
          assigneeID: z.string().optional(),
        }),
      ),
      async (c) => {
        return c.json(Task.create(c.req.valid("json")))
      },
    )
    .get(
      "/:taskID",
      describeRoute({
        summary: "Get task",
        description: "Get a specific task.",
        operationId: "task.get",
        responses: {
          200: {
            description: "Task info",
            content: {
              "application/json": {
                schema: resolver(Task.Info),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ taskID: z.string() })),
      async (c) => {
        return c.json(Task.get(c.req.valid("param").taskID))
      },
    )
    .patch(
      "/:taskID",
      describeRoute({
        summary: "Update task",
        description: "Update a task's properties.",
        operationId: "task.update",
        responses: {
          200: {
            description: "Updated task",
            content: {
              "application/json": {
                schema: resolver(Task.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ taskID: z.string() })),
      validator(
        "json",
        z.object({
          title: z.string().optional(),
          body: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assigneeKind: z.string().optional(),
          assigneeID: z.string().optional(),
          dueAt: z.number().optional(),
        }),
      ),
      async (c) => {
        const { taskID } = c.req.valid("param")
        return c.json(Task.update({ id: taskID, ...c.req.valid("json") }))
      },
    )
    .delete(
      "/:taskID",
      describeRoute({
        summary: "Delete task",
        description: "Delete a task.",
        operationId: "task.remove",
        responses: {
          200: {
            description: "Task deleted",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ taskID: z.string() })),
      async (c) => {
        Task.remove(c.req.valid("param").taskID)
        return c.json(true)
      },
    )
    .post(
      "/:taskID/move",
      describeRoute({
        summary: "Move task",
        description: "Move a task to a different status column and position.",
        operationId: "task.move",
        responses: {
          200: {
            description: "Moved task",
            content: {
              "application/json": {
                schema: resolver(Task.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ taskID: z.string() })),
      validator(
        "json",
        z.object({
          status: z.string(),
          position: z.number(),
        }),
      ),
      async (c) => {
        const { taskID } = c.req.valid("param")
        return c.json(Task.move({ id: taskID, ...c.req.valid("json") }))
      },
    ),
)
