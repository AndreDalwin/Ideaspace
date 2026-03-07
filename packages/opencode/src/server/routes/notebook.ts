import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { Notebook, Page } from "../../notebook"
import { errors } from "../error"
import { lazy } from "../../util/lazy"

export const NotebookRoutes = lazy(() =>
  new Hono()
    .get(
      "/",
      describeRoute({
        summary: "List notebooks",
        description: "List all notebooks in the current project.",
        operationId: "notebook.list",
        responses: {
          200: {
            description: "List of notebooks",
            content: {
              "application/json": {
                schema: resolver(Notebook.Info.array()),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(Notebook.list())
      },
    )
    .post(
      "/",
      describeRoute({
        summary: "Create notebook",
        description: "Create a new notebook in the current project.",
        operationId: "notebook.create",
        responses: {
          200: {
            description: "Created notebook",
            content: {
              "application/json": {
                schema: resolver(Notebook.Info),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator(
        "json",
        z.object({
          name: z.string(),
          icon: z.string().optional(),
        }),
      ),
      async (c) => {
        const info = Notebook.create(c.req.valid("json"))
        return c.json(info)
      },
    )
    .get(
      "/:notebookID",
      describeRoute({
        summary: "Get notebook",
        description: "Get a specific notebook.",
        operationId: "notebook.get",
        responses: {
          200: {
            description: "Notebook info",
            content: {
              "application/json": {
                schema: resolver(Notebook.Info),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ notebookID: z.string() })),
      async (c) => {
        return c.json(Notebook.get(c.req.valid("param").notebookID))
      },
    )
    .patch(
      "/:notebookID",
      describeRoute({
        summary: "Update notebook",
        description: "Update a notebook's name or icon.",
        operationId: "notebook.update",
        responses: {
          200: {
            description: "Updated notebook",
            content: {
              "application/json": {
                schema: resolver(Notebook.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ notebookID: z.string() })),
      validator(
        "json",
        z.object({
          name: z.string().optional(),
          icon: z.string().optional(),
        }),
      ),
      async (c) => {
        const { notebookID } = c.req.valid("param")
        return c.json(Notebook.update({ id: notebookID, ...c.req.valid("json") }))
      },
    )
    .delete(
      "/:notebookID",
      describeRoute({
        summary: "Delete notebook",
        description: "Delete a notebook and all its pages.",
        operationId: "notebook.remove",
        responses: {
          200: {
            description: "Notebook deleted",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ notebookID: z.string() })),
      async (c) => {
        Notebook.remove(c.req.valid("param").notebookID)
        return c.json(true)
      },
    )
    .get(
      "/:notebookID/page",
      describeRoute({
        summary: "List pages",
        description: "List all pages in a notebook.",
        operationId: "page.list",
        responses: {
          200: {
            description: "List of pages",
            content: {
              "application/json": {
                schema: resolver(Page.Info.array()),
              },
            },
          },
        },
      }),
      validator("param", z.object({ notebookID: z.string() })),
      async (c) => {
        return c.json(Page.list(c.req.valid("param").notebookID))
      },
    )
    .post(
      "/:notebookID/page",
      describeRoute({
        summary: "Create page",
        description: "Create a new page in a notebook.",
        operationId: "page.create",
        responses: {
          200: {
            description: "Created page",
            content: {
              "application/json": {
                schema: resolver(Page.Info),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("param", z.object({ notebookID: z.string() })),
      validator(
        "json",
        z.object({
          title: z.string(),
          body: z.string().optional(),
        }),
      ),
      async (c) => {
        const { notebookID } = c.req.valid("param")
        return c.json(Page.create({ notebookID, ...c.req.valid("json") }))
      },
    )
    .get(
      "/:notebookID/page/:pageID",
      describeRoute({
        summary: "Get page",
        description: "Get a specific page.",
        operationId: "page.get",
        responses: {
          200: {
            description: "Page info",
            content: {
              "application/json": {
                schema: resolver(Page.Info),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ notebookID: z.string(), pageID: z.string() })),
      async (c) => {
        return c.json(Page.get(c.req.valid("param").pageID))
      },
    )
    .patch(
      "/:notebookID/page/:pageID",
      describeRoute({
        summary: "Update page",
        description: "Update a page's title or body.",
        operationId: "page.update",
        responses: {
          200: {
            description: "Updated page",
            content: {
              "application/json": {
                schema: resolver(Page.Info),
              },
            },
          },
          ...errors(400, 404),
        },
      }),
      validator("param", z.object({ notebookID: z.string(), pageID: z.string() })),
      validator(
        "json",
        z.object({
          title: z.string().optional(),
          body: z.string().optional(),
        }),
      ),
      async (c) => {
        const { pageID } = c.req.valid("param")
        return c.json(Page.update({ id: pageID, ...c.req.valid("json") }))
      },
    )
    .delete(
      "/:notebookID/page/:pageID",
      describeRoute({
        summary: "Delete page",
        description: "Delete a page and its associated context item.",
        operationId: "page.remove",
        responses: {
          200: {
            description: "Page deleted",
            content: {
              "application/json": {
                schema: resolver(z.boolean()),
              },
            },
          },
          ...errors(404),
        },
      }),
      validator("param", z.object({ notebookID: z.string(), pageID: z.string() })),
      async (c) => {
        Page.remove(c.req.valid("param").pageID)
        return c.json(true)
      },
    ),
)
