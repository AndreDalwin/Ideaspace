import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { SessionContext } from "../../context"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const SessionContextRoutes = lazy(() =>
  new Hono()
    .get(
      "/:sessionID/context",
      describeRoute({
        summary: "List session context",
        description: "List all context items attached to a session.",
        operationId: "session.context.list",
        responses: {
          200: {
            description: "List of session context items",
            content: {
              "application/json": {
                schema: resolver(SessionContext.Info.array()),
              },
            },
          },
        },
      }),
      validator("param", z.object({ sessionID: z.string() })),
      async (c) => {
        return c.json(SessionContext.list(c.req.valid("param").sessionID))
      },
    )
    .post(
      "/:sessionID/context",
      describeRoute({
        summary: "Attach context to session",
        description: "Attach a context item to a session.",
        operationId: "session.context.attach",
        responses: {
          200: {
            description: "Attached context",
            content: {
              "application/json": {
                schema: resolver(SessionContext.Info),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("param", z.object({ sessionID: z.string() })),
      validator(
        "json",
        z.object({
          contextID: z.string(),
          position: z.number().optional(),
        }),
      ),
      async (c) => {
        const { sessionID } = c.req.valid("param")
        return c.json(SessionContext.attach({ sessionID, ...c.req.valid("json") }))
      },
    )
    .delete(
      "/:sessionID/context/:contextID",
      describeRoute({
        summary: "Detach context from session",
        description: "Detach a context item from a session.",
        operationId: "session.context.detach",
        responses: {
          200: {
            description: "Context detached",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ sessionID: z.string(), contextID: z.string() })),
      async (c) => {
        const { sessionID, contextID } = c.req.valid("param")
        SessionContext.detach({ sessionID, contextID })
        return c.json(true)
      },
    )
    .patch(
      "/:sessionID/context/:contextID",
      describeRoute({
        summary: "Toggle session context",
        description: "Enable or disable a context item in a session.",
        operationId: "session.context.toggle",
        responses: {
          200: {
            description: "Updated session context",
            content: {
              "application/json": {
                schema: resolver(SessionContext.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ sessionID: z.string(), contextID: z.string() })),
      validator(
        "json",
        z.object({
          enabled: z.boolean(),
        }),
      ),
      async (c) => {
        const { sessionID, contextID } = c.req.valid("param")
        return c.json(SessionContext.toggle({ sessionID, contextID, ...c.req.valid("json") }))
      },
    ),
)
