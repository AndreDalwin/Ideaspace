import { createContext, useContext, ParentProps, createSignal, createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import type { ContextFile, ContextSet, GlobalContext, SessionContext } from "@/types/context"

interface ContextBankState {
  files: ContextFile[]
  sets: ContextSet[]
  global: GlobalContext
  sessions: Record<string, SessionContext>
}

interface ContextBankActions {
  addFile: (file: ContextFile) => void
  removeFile: (path: string) => void
  addSet: (set: ContextSet) => void
  removeSet: (id: string) => void
  updateSet: (id: string, updates: Partial<ContextSet>) => void
  addToGlobal: (path: string) => void
  removeFromGlobal: (path: string) => void
  addToSession: (sessionId: string, path: string) => void
  removeFromSession: (sessionId: string, path: string) => void
  addSetToSession: (sessionId: string, setId: string) => void
  removeSetFromSession: (sessionId: string, setId: string) => void
  getSessionContext: (sessionId: string) => SessionContext | undefined
  calculateTokens: (paths: string[]) => number
}

interface ContextBankValue {
  state: ContextBankState
  actions: ContextBankActions
}

const ContextBankContext = createContext<ContextBankValue>()

export function ContextBankProvider(props: ParentProps) {
  const [state, setState] = createStore<ContextBankState>({
    files: [],
    sets: [],
    global: { files: [] },
    sessions: {},
  })

  const [currentSessionId, setCurrentSessionId] = createSignal<string>("")

  const actions: ContextBankActions = {
    addFile: (file) => {
      setState("files", (files) => {
        if (files.some((f) => f.path === file.path)) return files
        return [...files, file]
      })
    },

    removeFile: (path) => {
      setState("files", (files) => files.filter((f) => f.path !== path))
      setState("global", "files", (files) => files.filter((p) => p !== path))
      setState("sets", (sets) =>
        sets.map((s) => ({
          ...s,
          files: s.files.filter((p) => p !== path),
        })),
      )
      setState("sessions", (sessions) => {
        const next: Record<string, SessionContext> = {}
        for (const [id, session] of Object.entries(sessions)) {
          next[id] = {
            ...session,
            files: session.files.filter((p) => p !== path),
          }
        }
        return next
      })
    },

    addSet: (set) => {
      setState("sets", (sets) => {
        if (sets.some((s) => s.id === set.id)) return sets
        return [...sets, set]
      })
    },

    removeSet: (id) => {
      setState("sets", (sets) => sets.filter((s) => s.id !== id))
      setState("sessions", (sessions) => {
        const next: Record<string, SessionContext> = {}
        for (const [sid, session] of Object.entries(sessions)) {
          next[sid] = {
            ...session,
            sets: session.sets.filter((s) => s !== id),
          }
        }
        return next
      })
    },

    updateSet: (id, updates) => {
      setState("sets", (sets) => sets.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    },

    addToGlobal: (path) => {
      setState("global", "files", (files) => {
        if (files.includes(path)) return files
        return [...files, path]
      })
    },

    removeFromGlobal: (path) => {
      setState("global", "files", (files) => files.filter((p) => p !== path))
    },

    addToSession: (sessionId, path) => {
      setState("sessions", sessionId, (session) => {
        if (!session) {
          return { sessionId, files: [path], sets: [] }
        }
        if (session.files.includes(path)) return session
        return { ...session, files: [...session.files, path] }
      })
    },

    removeFromSession: (sessionId, path) => {
      setState("sessions", sessionId, "files", (files) => files.filter((p) => p !== path))
    },

    addSetToSession: (sessionId, setId) => {
      setState("sessions", sessionId, (session) => {
        if (!session) {
          return { sessionId, files: [], sets: [setId] }
        }
        if (session.sets.includes(setId)) return session
        return { ...session, sets: [...session.sets, setId] }
      })
    },

    removeSetFromSession: (sessionId, setId) => {
      setState("sessions", sessionId, "sets", (sets) => sets.filter((s) => s !== setId))
    },

    getSessionContext: (sessionId) => {
      return state.sessions[sessionId]
    },

    calculateTokens: (paths) => {
      return paths.reduce((total, path) => {
        const file = state.files.find((f) => f.path === path)
        return total + (file?.tokenCount || 0)
      }, 0)
    },
  }

  const value = createMemo(() => ({
    state,
    actions,
  }))

  return <ContextBankContext.Provider value={value()}>{props.children}</ContextBankContext.Provider>
}

export function useContextBank() {
  const ctx = useContext(ContextBankContext)
  if (!ctx) {
    throw new Error("useContextBank must be used within a ContextBankProvider")
  }
  return ctx
}
