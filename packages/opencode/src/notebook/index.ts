import z from "zod"
import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import { Identifier } from "@/id/id"
import { Database, NotFoundError, eq, and, desc } from "@/storage/db"
import { NotebookTable, PageTable } from "./notebook.sql"
import { ContextItemTable } from "../context/context.sql"
import { Instance } from "@/project/instance"
import { fn } from "@/util/fn"
import { encode } from "gpt-tokenizer"

export namespace Notebook {
  export const Info = z
    .object({
      id: z.string(),
      projectID: z.string(),
      name: z.string(),
      icon: z.string().optional(),
      position: z.number(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "Notebook" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("notebook.created", z.object({ info: Info })),
    Updated: BusEvent.define("notebook.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("notebook.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof NotebookTable.$inferSelect): Info {
    return {
      id: row.id,
      projectID: row.project_id,
      name: row.name,
      icon: row.icon ?? undefined,
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
        .from(NotebookTable)
        .where(eq(NotebookTable.project_id, Instance.project.id))
        .orderBy(NotebookTable.position)
        .all(),
    )
    return rows.map(fromRow)
  }

  export const get = fn(z.string(), (id) => {
    const row = Database.use((db) => db.select().from(NotebookTable).where(eq(NotebookTable.id, id)).get())
    if (!row) throw new NotFoundError({ message: `Notebook not found: ${id}` })
    return fromRow(row)
  })

  export const create = fn(
    z.object({
      name: z.string(),
      icon: z.string().optional(),
    }),
    (input) => {
      const id = Identifier.ascending("notebook")
      const existing = list()
      const position = existing.length
      const info: Info = {
        id,
        projectID: Instance.project.id,
        name: input.name,
        icon: input.icon,
        position,
        time: {
          created: Date.now(),
          updated: Date.now(),
        },
      }
      Database.use((db) => {
        db.insert(NotebookTable)
          .values({
            id: info.id,
            project_id: info.projectID,
            name: info.name,
            icon: info.icon ?? null,
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
      name: z.string().optional(),
      icon: z.string().optional(),
    }),
    (input) => {
      return Database.use((db) => {
        const set: Record<string, unknown> = { time_updated: Date.now() }
        if (input.name !== undefined) set.name = input.name
        if (input.icon !== undefined) set.icon = input.icon
        const row = db.update(NotebookTable).set(set).where(eq(NotebookTable.id, input.id)).returning().get()
        if (!row) throw new NotFoundError({ message: `Notebook not found: ${input.id}` })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )

  export const remove = fn(z.string(), (id) => {
    const info = get(id)
    Database.use((db) => {
      db.delete(NotebookTable).where(eq(NotebookTable.id, id)).run()
      Database.effect(() => Bus.publish(Event.Deleted, { info }))
    })
  })
}

export namespace Page {
  export const Info = z
    .object({
      id: z.string(),
      notebookID: z.string(),
      title: z.string(),
      body: z.string(),
      position: z.number(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "Page" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("page.created", z.object({ info: Info })),
    Updated: BusEvent.define("page.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("page.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof PageTable.$inferSelect): Info {
    return {
      id: row.id,
      notebookID: row.notebook_id,
      title: row.title,
      body: row.body,
      position: row.position,
      time: {
        created: row.time_created,
        updated: row.time_updated,
      },
    }
  }

  export const list = fn(z.string(), (notebookID) => {
    const rows = Database.use((db) =>
      db
        .select()
        .from(PageTable)
        .where(eq(PageTable.notebook_id, notebookID))
        .orderBy(PageTable.position)
        .all(),
    )
    return rows.map(fromRow)
  })

  export const get = fn(z.string(), (id) => {
    const row = Database.use((db) => db.select().from(PageTable).where(eq(PageTable.id, id)).get())
    if (!row) throw new NotFoundError({ message: `Page not found: ${id}` })
    return fromRow(row)
  })

  export const create = fn(
    z.object({
      notebookID: z.string(),
      title: z.string(),
      body: z.string().optional(),
    }),
    (input) => {
      const id = Identifier.ascending("page")
      const existing = list(input.notebookID)
      const position = existing.length
      const body = input.body ?? ""
      const info: Info = {
        id,
        notebookID: input.notebookID,
        title: input.title,
        body,
        position,
        time: {
          created: Date.now(),
          updated: Date.now(),
        },
      }

      const notebook = Notebook.get(input.notebookID)
      const tokens = body ? encode(body).length : 0

      Database.use((db) => {
        db.insert(PageTable)
          .values({
            id: info.id,
            notebook_id: info.notebookID,
            title: info.title,
            body: info.body,
            position: info.position,
            time_created: info.time.created,
            time_updated: info.time.updated,
          })
          .run()

        // Auto-create context item for this page
        const ctxId = Identifier.ascending("context_item")
        db.insert(ContextItemTable)
          .values({
            id: ctxId,
            project_id: notebook.projectID,
            kind: "page",
            ref_id: info.id,
            title: info.title,
            body: info.body,
            tokens,
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
    }),
    (input) => {
      return Database.use((db) => {
        const set: Record<string, unknown> = { time_updated: Date.now() }
        if (input.title !== undefined) set.title = input.title
        if (input.body !== undefined) set.body = input.body

        const row = db.update(PageTable).set(set).where(eq(PageTable.id, input.id)).returning().get()
        if (!row) throw new NotFoundError({ message: `Page not found: ${input.id}` })
        const info = fromRow(row)

        // Update corresponding context item
        const ctxSet: Record<string, unknown> = { time_updated: Date.now() }
        if (input.title !== undefined) ctxSet.title = input.title
        if (input.body !== undefined) {
          ctxSet.body = input.body
          ctxSet.tokens = encode(input.body).length
        }
        db.update(ContextItemTable)
          .set(ctxSet)
          .where(and(eq(ContextItemTable.kind, "page"), eq(ContextItemTable.ref_id, input.id)))
          .run()

        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )

  export const remove = fn(z.string(), (id) => {
    const info = get(id)
    Database.use((db) => {
      // Delete corresponding context item
      db.delete(ContextItemTable)
        .where(and(eq(ContextItemTable.kind, "page"), eq(ContextItemTable.ref_id, id)))
        .run()
      db.delete(PageTable).where(eq(PageTable.id, id)).run()
      Database.effect(() => Bus.publish(Event.Deleted, { info }))
    })
  })
}
