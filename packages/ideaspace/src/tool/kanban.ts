import z from "zod"
import { Tool } from "./tool"
import { Kanban } from "@/kanban"

export const KanbanReadTool = Tool.define("kanban_read", {
  description: "Read the project kanban board stored in .ideaspace/kanban.json.",
  parameters: z.object({}),
  async execute(_params, ctx) {
    await ctx.ask({
      permission: "kanban_read",
      patterns: [".ideaspace/kanban.json"],
      always: ["*"],
      metadata: {},
    })

    const board = await Kanban.get()
    return {
      title: `${board.items.length} kanban items`,
      output: JSON.stringify(board, null, 2),
      metadata: { board },
    }
  },
})

export const KanbanCreateTool = Tool.define("kanban_create", {
  description:
    "Create a new kanban card in .ideaspace/kanban.json. Use this for project tasks that should live on the kanban board, not the session todo list.",
  parameters: z.object({
    title: z.string().describe("Short kanban card title"),
    detail: z.string().optional().describe("Optional supporting detail for the card"),
    status: Kanban.Status.optional().describe("Card column: planned, in_progress, done, or blocked"),
    priority: Kanban.Priority.optional().describe("Card priority: high, medium, or low"),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "kanban_create",
      patterns: [".ideaspace/kanban.json"],
      always: ["*"],
      metadata: {},
    })

    const created = await Kanban.create(params)
    return {
      title: created.title,
      output: JSON.stringify(created, null, 2),
      metadata: { item: created },
    }
  },
})

export const KanbanUpdateTool = Tool.define("kanban_update", {
  description:
    "Update an existing kanban card in .ideaspace/kanban.json. Use this to change title, detail, priority, or move a card between planned, in_progress, done, and blocked.",
  parameters: z.object({
    id: z.string().describe("Existing kanban card id"),
    title: z.string().optional().describe("Updated kanban card title"),
    detail: z.string().optional().describe("Updated supporting detail"),
    status: Kanban.Status.optional().describe("Updated card column"),
    priority: Kanban.Priority.optional().describe("Updated priority"),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "kanban_update",
      patterns: [".ideaspace/kanban.json"],
      always: ["*"],
      metadata: {},
    })

    const updated = await Kanban.update(params)
    return {
      title: updated.title,
      output: JSON.stringify(updated, null, 2),
      metadata: { item: updated },
    }
  },
})
