import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import z from "zod"
import { Config } from "@/config/config"
import { Settings } from "@/settings"
import { Skill } from "@/skill/skill"
import { errors } from "../error"
import { lazy } from "@/util/lazy"

export const SettingsRoutes = lazy(() =>
  new Hono()
    .get(
      "/mcp",
      describeRoute({
        summary: "List global MCP configuration",
        description: "Get all global-only MCP configuration entries from the settings file.",
        operationId: "settings.mcp.list",
        responses: {
          200: {
            description: "Global MCP configuration",
            content: {
              "application/json": {
                schema: resolver(Settings.McpList),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(await Settings.listMcp())
      },
    )
    .post(
      "/mcp",
      describeRoute({
        summary: "Create global MCP configuration",
        description: "Create a global-only MCP configuration entry.",
        operationId: "settings.mcp.create",
        responses: {
          200: {
            description: "Global MCP configuration",
            content: {
              "application/json": {
                schema: resolver(Settings.McpList),
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
          config: Config.Mcp,
        }),
      ),
      async (c) => {
        const body = c.req.valid("json")
        return c.json(await Settings.setMcp(body.name, body.config))
      },
    )
    .put(
      "/mcp/:name",
      describeRoute({
        summary: "Update global MCP configuration",
        description: "Update a global-only MCP configuration entry.",
        operationId: "settings.mcp.update",
        responses: {
          200: {
            description: "Global MCP configuration",
            content: {
              "application/json": {
                schema: resolver(Settings.McpList),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("param", z.object({ name: z.string() })),
      validator(
        "json",
        z.object({
          config: Config.Mcp,
        }),
      ),
      async (c) => {
        const param = c.req.valid("param")
        const body = c.req.valid("json")
        return c.json(await Settings.setMcp(param.name, body.config))
      },
    )
    .delete(
      "/mcp/:name",
      describeRoute({
        summary: "Delete global MCP configuration",
        description: "Delete a global-only MCP configuration entry from the settings file.",
        operationId: "settings.mcp.delete",
        responses: {
          200: {
            description: "Global MCP configuration",
            content: {
              "application/json": {
                schema: resolver(Settings.McpList),
              },
            },
          },
        },
      }),
      validator("param", z.object({ name: z.string() })),
      async (c) => {
        const param = c.req.valid("param")
        return c.json(await Settings.removeMcp(param.name))
      },
    )
    .post(
      "/skill/import",
      describeRoute({
        summary: "Import global skills",
        description:
          "Copy a local skill directory into the managed global skill catalog and return the current skill catalog.",
        operationId: "settings.skill.import",
        responses: {
          200: {
            description: "Skill catalog",
            content: {
              "application/json": {
                schema: resolver(Skill.Info.array()),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("json", Settings.SkillImport),
      async (c) => {
        const body = c.req.valid("json")
        return c.json(await Settings.importSkillDirectory(body.url, body.replace))
      },
    )
    .post(
      "/skill/remove",
      describeRoute({
        summary: "Remove global skills",
        description: "Remove a managed global skill and return the current skill catalog.",
        operationId: "settings.skill.remove",
        responses: {
          200: {
            description: "Skill catalog",
            content: {
              "application/json": {
                schema: resolver(Skill.Info.array()),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("json", Settings.SkillRemove),
      async (c) => {
        const body = c.req.valid("json")
        return c.json(await Settings.removeManagedSkill(body.url))
      },
    ),
)
