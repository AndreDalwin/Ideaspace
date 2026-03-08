export interface ContextFile {
  path: string
  name: string
  type: "file" | "folder"
  tokenCount?: number
}

export interface ContextSet {
  id: string
  name: string
  description: string
  files: string[]
  icon?: string
  createdAt: number
}

export interface GlobalContext {
  files: string[]
}

export interface SessionContext {
  sessionId: string
  files: string[]
  sets: string[]
}
