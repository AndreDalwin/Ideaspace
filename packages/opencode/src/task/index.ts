import z from "zod"
import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import { Identifier } from "@/id/id"
import { Database, NotFoundError, eq, and, desc } from "@/storage/db"
import { TaskTable } from "./task.sql"
import { Instance } from "@/project/instance"
import { fn } from "@/util/fn"

export namespace Task {
  export const Info = z
    .object({
      id: z.string(),
      projectID: z.string(),
      boardID: z.string().optional(),
      title: z.string(),
      body: z.string().optional(),
      status: z.string(),
      priority: z.string(),
      assigneeKind: z.string().optional(),
      assigneeID: z.string().optional(),
      dueAt: z.number().optional(),
      position: z.number(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "Task" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("task.created", z.object({ info: Info })),
    Updated: BusEvent.define("task.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("task.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof TaskTable.$inferSelect): Info {
    return {
      id: row.id,
      projectID: row.project_id,
      boardID: row.board_id ?? undefined,
      title: row.title,
      body: row.body ?? undefined,
      status: row.status,
      priority: row.priority,
      assigneeKind: row.assignee_kind ?? undefined,
      assigneeID: row.assignee_id ?? undefined,
      dueAt: row.due_at ?? undefined,
      position: row.position,
      time: {
        created: row.time_created,
        updated: row.time_updated,
      },
    }
  }

  export function list() {
    const rows = Database.use((db) =>
      db
        .select()
        .from(TaskTable)
        .where(eq(TaskTable.project_id, Instance.project.id))
        .orderBy(TaskTable.status, TaskTable.position)
        .all(),
    )
    return rows.map(fromRow)
  }

  export const get = fn(z.string(), (id) => {
    const row = Database.use((db) => db.select().from(TaskTable).where(eq(TaskTable.id, id)).get())
    if (!row) throw new NotFoundError({ message: `Task not found: ${id}` })
    return fromRow(row)
  })

  export const create = fn(
    z.object({
      title: z.string(),
      body: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeKind: z.string().optional(),
      assigneeID: z.string().optional(),
    }),
    (input) => {
      const id = Identifier.ascending("task")
      const status = input.status ?? "backlog"
      const existing = Database.use((db) =>
        db
          .select()
          .from(TaskTable)
          .where(and(eq(TaskTable.project_id, Instance.project.id), eq(TaskTable.status, status)))
          .all(),
      )
      const position = existing.length
      const info: Info = {
        id,
        projectID: Instance.project.id,
        title: input.title,
        body: input.body,
        status,
        priority: input.priority ?? "medium",
        assigneeKind: input.assigneeKind,
        assigneeID: input.assigneeID,
        position,
        time: {
          created: Date.now(),
          updated: Date.now(),
        },
      }
      Database.use((db) => {
        db.insert(TaskTable)
          .values({
            id: info.id,
            project_id: info.projectID,
            board_id: info.boardID ?? null,
            title: info.title,
            body: info.body ?? null,
            status: info.status,
            priority: info.priority,
            assignee_kind: info.assigneeKind ?? null,
            assignee_id: info.assigneeID ?? null,
            due_at: info.dueAt ?? null,
            position: info.position,
            time_created: info.time.created,
            time_updated: info.time.updated,
          })
          .run()
        Database.effect(() => Bus.publish(Event.Created, { info }))
      })
      return info
    },
  )

  export const update = fn(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      body: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assigneeKind: z.string().optional(),
      assigneeID: z.string().optional(),
      dueAt: z.number().optional(),
    }),
    (input) => {
      return Database.use((db) => {
        const set: Record<string, unknown> = { time_updated: Date.now() }
        if (input.title !== undefined) set.title = input.title
        if (input.body !== undefined) set.body = input.body
        if (input.status !== undefined) set.status = input.status
        if (input.priority !== undefined) set.priority = input.priority
        if (input.assigneeKind !== undefined) set.assignee_kind = input.assigneeKind
        if (input.assigneeID !== undefined) set.assignee_id = input.assigneeID
        if (input.dueAt !== undefined) set.due_at = input.dueAt
        const row = db.update(TaskTable).set(set).where(eq(TaskTable.id, input.id)).returning().get()
        if (!row) throw new NotFoundError({ message: `Task not found: ${input.id}` })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )

  export const move = fn(
    z.object({
      id: z.string(),
      status: z.string(),
      position: z.number(),
    }),
    (input) => {
      return Database.use((db) => {
        const row = db
          .update(TaskTable)
          .set({ status: input.status, position: input.position, time_updated: Date.now() })
          .where(eq(TaskTable.id, input.id))
          .returning()
          .get()
        if (!row) throw new NotFoundError({ message: `Task not found: ${input.id}` })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )

  export const remove = fn(z.string(), (id) => {
    const info = get(id)
    Database.use((db) => {
      db.delete(TaskTable).where(eq(TaskTable.id, id)).run()
      Database.effect(() => Bus.publish(Event.Deleted, { info }))
    })
  })
}
