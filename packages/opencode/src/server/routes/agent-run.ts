import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { AgentRun } from "../../agent-run"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const AgentRunRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List agent runs",
        description: "List agent runs, optionally filtered by session or task.",
        operationId: "agentRun.list",
        responses: {
          200: {
            description: "List of agent runs",
            content: {
              "application/json": {
                schema: resolver(AgentRun.Info.array()),
              },
            },
          },
        },
      }),
      validator(
        "query",
        z.object({
          sessionID: z.string().optional(),
          taskID: z.string().optional(),
        }),
      ),
      async (c) => {
        const query = c.req.valid("query")
        return c.json(AgentRun.list(query))
      },
    )
    .get(
      "/:runID",
      describeRoute({
        summary: "Get agent run",
        description: "Get a specific agent run.",
        operationId: "agentRun.get",
        responses: {
          200: {
            description: "Agent run info",
            content: {
              "application/json": {
                schema: resolver(AgentRun.Info),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ runID: z.string() })),
      async (c) => {
        return c.json(AgentRun.get(c.req.valid("param").runID))
      },
    ),
)
