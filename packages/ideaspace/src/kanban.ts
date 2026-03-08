import path from "path"
import { randomUUID } from "crypto"
import z from "zod"
import { Instance } from "@/project/instance"
import { Filesystem } from "@/util/filesystem"

export namespace Kanban {
  export const Status = z.enum(["planned", "in_progress", "done", "blocked"])
  export const Priority = z.enum(["high", "medium", "low"])
  export const Item = z.object({
    id: z.string(),
    title: z.string(),
    detail: z.string().default(""),
    status: Status,
    priority: Priority,
  })
  export type Item = z.infer<typeof Item>

  export const Board = z.object({
    items: z.array(Item),
  })
  export type Board = z.infer<typeof Board>

  export const pathFor = () => path.join(Instance.worktree, ".ideaspace", "kanban.json")

  export async function get() {
    const file = pathFor()
    if (!(await Filesystem.exists(file))) return { items: [] } satisfies Board
    return Board.parse(await Filesystem.readJson(file))
  }

  export async function put(board: Board) {
    const next = Board.parse(board)
    await Filesystem.writeJson(pathFor(), next)
    return next
  }

  export async function create(input: {
    title: string
    detail?: string
    status?: Item["status"]
    priority?: Item["priority"]
  }) {
    const board = await get()
    const item = Item.parse({
      id: randomUUID(),
      title: input.title,
      detail: input.detail ?? "",
      status: input.status ?? "planned",
      priority: input.priority ?? "medium",
    })
    board.items.push(item)
    await put(board)
    return item
  }

  export async function update(input: {
    id: string
    title?: string
    detail?: string
    status?: Item["status"]
    priority?: Item["priority"]
  }) {
    const board = await get()
    const at = board.items.findIndex((item) => item.id === input.id)
    if (at < 0) throw new Error(`Kanban item \"${input.id}\" not found`)
    const current = board.items[at]
    if (!current) throw new Error(`Kanban item \"${input.id}\" not found`)
    const item = Item.parse({
      id: current.id,
      title: input.title ?? current.title,
      detail: input.detail ?? current.detail,
      status: input.status ?? current.status,
      priority: input.priority ?? current.priority,
    })
    board.items.splice(at, 1, item)
    await put(board)
    return item
  }
}
