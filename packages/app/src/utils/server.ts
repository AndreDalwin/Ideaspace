import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"
import type { ServerConnection } from "@/context/server"

export function pickFetch(server: ServerConnection.HttpBase, fetch?: typeof globalThis.fetch) {
  if (!fetch) return
  try {
    const url = new URL(server.url)
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
    if (url.protocol === "http:" && loopback) return
  } catch {
    return fetch
  }
  return fetch
}

export function createSdkForServer({
  server,
  ...config
}: Omit<NonNullable<Parameters<typeof createOpencodeClient>[0]>, "baseUrl"> & {
  server: ServerConnection.HttpBase
}) {
  const auth = (() => {
    if (!server.password) return
    return {
      Authorization: `Basic ${btoa(`${server.username ?? "ideaspace"}:${server.password}`)}`,
    }
  })()

  return createOpencodeClient({
    ...config,
    fetch: pickFetch(server, config.fetch),
    headers: { ...config.headers, ...auth },
    baseUrl: server.url,
  })
}
