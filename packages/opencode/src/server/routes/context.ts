import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { ContextItem } from "../../context"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const ContextRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List context items",
        description: "List all context items in the current project.",
        operationId: "context.list",
        responses: {
          200: {
            description: "List of context items",
            content: {
              "application/json": {
                schema: resolver(ContextItem.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(ContextItem.list())
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create context item",
        description: "Create a new context item in the current project.",
        operationId: "context.create",
        responses: {
          200: {
            description: "Created context item",
            content: {
              "application/json": {
                schema: resolver(ContextItem.Info),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator(
        "json",
        z.object({
          kind: z.string(),
          title: z.string(),
          body: z.string().optional(),
          refID: z.string().optional(),
          pinned: z.boolean().optional(),
        }),
      ),
      async (c) => {
        return c.json(ContextItem.create(c.req.valid("json")))
      },
    )
    .get(
      "/:contextID",
      describeRoute({
        summary: "Get context item",
        description: "Get a specific context item.",
        operationId: "context.get",
        responses: {
          200: {
            description: "Context item info",
            content: {
              "application/json": {
                schema: resolver(ContextItem.Info),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ contextID: z.string() })),
      async (c) => {
        return c.json(ContextItem.get(c.req.valid("param").contextID))
      },
    )
    .patch(
      "/:contextID",
      describeRoute({
        summary: "Update context item",
        description: "Update a context item's properties.",
        operationId: "context.update",
        responses: {
          200: {
            description: "Updated context item",
            content: {
              "application/json": {
                schema: resolver(ContextItem.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ contextID: z.string() })),
      validator(
        "json",
        z.object({
          title: z.string().optional(),
          body: z.string().optional(),
          pinned: z.boolean().optional(),
          security: z.string().optional(),
        }),
      ),
      async (c) => {
        const { contextID } = c.req.valid("param")
        return c.json(ContextItem.update({ id: contextID, ...c.req.valid("json") }))
      },
    )
    .delete(
      "/:contextID",
      describeRoute({
        summary: "Delete context item",
        description: "Delete a context item.",
        operationId: "context.remove",
        responses: {
          200: {
            description: "Context item deleted",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ contextID: z.string() })),
      async (c) => {
        ContextItem.remove(c.req.valid("param").contextID)
        return c.json(true)
      },
    ),
)
