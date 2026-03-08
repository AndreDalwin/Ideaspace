import { describe, expect, test } from "bun:test"
import type { ServerConnection } from "@/context/server"
import { pickFetch } from "./server"

const fetch = globalThis.fetch

describe("pickFetch", () => {
  test("skips platform fetch for local http sidecars", () => {
    const server: ServerConnection.HttpBase = {
      url: "http://127.0.0.1:4096",
    }

    expect(pickFetch(server, fetch)).toBeUndefined()
  })

  test("keeps platform fetch for remote hosts", () => {
    const server: ServerConnection.HttpBase = {
      url: "https://ideaspace.ai",
    }

    expect(pickFetch(server, fetch)).toBe(fetch)
  })

  test("keeps platform fetch for invalid urls", () => {
    const server: ServerConnection.HttpBase = {
      url: "not-a-url",
    }

    expect(pickFetch(server, fetch)).toBe(fetch)
  })
})
