import z from "zod"
import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import { Identifier } from "@/id/id"
import { Database, NotFoundError, eq, and, desc } from "@/storage/db"
import { ContextItemTable, SessionContextTable } from "./context.sql"
import { Instance } from "@/project/instance"
import { fn } from "@/util/fn"
import { encode } from "gpt-tokenizer"

export namespace ContextItem {
  export const Info = z
    .object({
      id: z.string(),
      projectID: z.string(),
      kind: z.string(),
      refID: z.string().optional(),
      title: z.string(),
      body: z.string().optional(),
      security: z.string(),
      pinned: z.boolean(),
      tokens: z.number().optional(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "ContextItem" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("context_item.created", z.object({ info: Info })),
    Updated: BusEvent.define("context_item.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("context_item.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof ContextItemTable.$inferSelect): Info {
    return {
      id: row.id,
      projectID: row.project_id,
      kind: row.kind,
      refID: row.ref_id ?? undefined,
      title: row.title,
      body: row.body ?? undefined,
      security: row.security,
      pinned: row.pinned === 1,
      tokens: row.tokens ?? undefined,
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
        .from(ContextItemTable)
        .where(eq(ContextItemTable.project_id, Instance.project.id))
        .orderBy(desc(ContextItemTable.pinned), ContextItemTable.time_created)
        .all(),
    )
    return rows.map(fromRow)
  }

  export const get = fn(z.string(), (id) => {
    const row = Database.use((db) => db.select().from(ContextItemTable).where(eq(ContextItemTable.id, id)).get())
    if (!row) throw new NotFoundError({ message: `Context item not found: ${id}` })
    return fromRow(row)
  })

  export const create = fn(
    z.object({
      kind: z.string(),
      title: z.string(),
      body: z.string().optional(),
      refID: z.string().optional(),
      pinned: z.boolean().optional(),
    }),
    (input) => {
      const id = Identifier.ascending("context_item")
      const tokens = input.body ? encode(input.body).length : undefined
      const info: Info = {
        id,
        projectID: Instance.project.id,
        kind: input.kind,
        refID: input.refID,
        title: input.title,
        body: input.body,
        security: "public",
        pinned: input.pinned ?? false,
        tokens,
        time: {
          created: Date.now(),
          updated: Date.now(),
        },
      }
      Database.use((db) => {
        db.insert(ContextItemTable)
          .values({
            id: info.id,
            project_id: info.projectID,
            kind: info.kind,
            ref_id: info.refID ?? null,
            title: info.title,
            body: info.body ?? null,
            security: info.security,
            pinned: info.pinned ? 1 : 0,
            tokens: info.tokens ?? null,
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
      pinned: z.boolean().optional(),
      security: z.string().optional(),
    }),
    (input) => {
      return Database.use((db) => {
        const set: Record<string, unknown> = { time_updated: Date.now() }
        if (input.title !== undefined) set.title = input.title
        if (input.body !== undefined) {
          set.body = input.body
          set.tokens = encode(input.body).length
        }
        if (input.pinned !== undefined) set.pinned = input.pinned ? 1 : 0
        if (input.security !== undefined) set.security = input.security
        const row = db.update(ContextItemTable).set(set).where(eq(ContextItemTable.id, input.id)).returning().get()
        if (!row) throw new NotFoundError({ message: `Context item not found: ${input.id}` })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )

  export const remove = fn(z.string(), (id) => {
    const info = get(id)
    Database.use((db) => {
      db.delete(ContextItemTable).where(eq(ContextItemTable.id, id)).run()
      Database.effect(() => Bus.publish(Event.Deleted, { info }))
    })
  })
}

export namespace SessionContext {
  export const Info = z
    .object({
      sessionID: z.string(),
      contextID: z.string(),
      enabled: z.boolean(),
      position: z.number(),
      context: ContextItem.Info.optional(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
      }),
    })
    .meta({ ref: "SessionContext" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Created: BusEvent.define("session_context.created", z.object({ info: Info })),
    Updated: BusEvent.define("session_context.updated", z.object({ info: Info })),
    Deleted: BusEvent.define("session_context.deleted", z.object({ info: Info })),
  }

  function fromRow(row: typeof SessionContextTable.$inferSelect, context?: ContextItem.Info): Info {
    return {
      sessionID: row.session_id,
      contextID: row.context_id,
      enabled: row.enabled === 1,
      position: row.position,
      context,
      time: {
        created: row.time_created,
        updated: row.time_updated,
      },
    }
  }

  export const list = fn(z.string(), (sessionID) => {
    const rows = Database.use((db) =>
      db
        .select()
        .from(SessionContextTable)
        .where(eq(SessionContextTable.session_id, sessionID))
        .orderBy(SessionContextTable.position)
        .all(),
    )
    return rows.map((row) => {
      const ctx = Database.use((db) =>
        db.select().from(ContextItemTable).where(eq(ContextItemTable.id, row.context_id)).get(),
      )
      const contextInfo = ctx
        ? ({
            id: ctx.id,
            projectID: ctx.project_id,
            kind: ctx.kind,
            refID: ctx.ref_id ?? undefined,
            title: ctx.title,
            body: ctx.body ?? undefined,
            security: ctx.security,
            pinned: ctx.pinned === 1,
            tokens: ctx.tokens ?? undefined,
            time: { created: ctx.time_created, updated: ctx.time_updated },
          } satisfies ContextItem.Info)
        : undefined
      return fromRow(row, contextInfo)
    })
  })

  export const attach = fn(
    z.object({
      sessionID: z.string(),
      contextID: z.string(),
      position: z.number().optional(),
    }),
    (input) => {
      const existing = list(input.sessionID)
      const position = input.position ?? existing.length
      const now = Date.now()
      Database.use((db) => {
        db.insert(SessionContextTable)
          .values({
            session_id: input.sessionID,
            context_id: input.contextID,
            enabled: 1,
            position,
            time_created: now,
            time_updated: now,
          })
          .onConflictDoNothing()
          .run()
      })
      const rows = Database.use((db) =>
        db
          .select()
          .from(SessionContextTable)
          .where(
            and(eq(SessionContextTable.session_id, input.sessionID), eq(SessionContextTable.context_id, input.contextID)),
          )
          .get(),
      )
      if (!rows) throw new NotFoundError({ message: "Session context not found" })
      const info = fromRow(rows)
      Bus.publish(Event.Created, { info })
      return info
    },
  )

  export const detach = fn(
    z.object({
      sessionID: z.string(),
      contextID: z.string(),
    }),
    (input) => {
      const row = Database.use((db) =>
        db
          .select()
          .from(SessionContextTable)
          .where(
            and(eq(SessionContextTable.session_id, input.sessionID), eq(SessionContextTable.context_id, input.contextID)),
          )
          .get(),
      )
      if (!row) throw new NotFoundError({ message: "Session context not found" })
      const info = fromRow(row)
      Database.use((db) => {
        db.delete(SessionContextTable)
          .where(
            and(eq(SessionContextTable.session_id, input.sessionID), eq(SessionContextTable.context_id, input.contextID)),
          )
          .run()
        Database.effect(() => Bus.publish(Event.Deleted, { info }))
      })
    },
  )

  export const toggle = fn(
    z.object({
      sessionID: z.string(),
      contextID: z.string(),
      enabled: z.boolean(),
    }),
    (input) => {
      return Database.use((db) => {
        const row = db
          .update(SessionContextTable)
          .set({ enabled: input.enabled ? 1 : 0, time_updated: Date.now() })
          .where(
            and(eq(SessionContextTable.session_id, input.sessionID), eq(SessionContextTable.context_id, input.contextID)),
          )
          .returning()
          .get()
        if (!row) throw new NotFoundError({ message: "Session context not found" })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )
}
