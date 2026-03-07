import { Database, eq, and, desc } from "@/storage/db"
import { SessionContextTable, ContextItemTable } from "../context/context.sql"
import { PageTable } from "../notebook/notebook.sql"
import { encode } from "gpt-tokenizer"

export namespace ContextAssembly {
  export async function assemble(sessionID: string): Promise<string[]> {
    const rows = Database.use((db) =>
      db
        .select({
          contextId: SessionContextTable.context_id,
          enabled: SessionContextTable.enabled,
          position: SessionContextTable.position,
        })
        .from(SessionContextTable)
        .where(and(eq(SessionContextTable.session_id, sessionID), eq(SessionContextTable.enabled, 1)))
        .orderBy(SessionContextTable.position)
        .all(),
    )

    if (rows.length === 0) return []

    const parts: string[] = []

    for (const row of rows) {
      const item = Database.use((db) =>
        db.select().from(ContextItemTable).where(eq(ContextItemTable.id, row.contextId)).get(),
      )
      if (!item) continue

      let content: string | undefined

      if (item.kind === "page" && item.ref_id) {
        const page = Database.use((db) => db.select().from(PageTable).where(eq(PageTable.id, item.ref_id!)).get())
        content = page?.body || item.body || undefined
      } else {
        content = item.body || undefined
      }

      if (!content) continue

      const tokens = item.tokens ?? encode(content).length
      parts.push(`<context title="${item.title}" tokens="${tokens}">\n${content}\n</context>`)
    }

    return parts
  }
}
