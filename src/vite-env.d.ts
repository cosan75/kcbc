/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_SHEETS_WEBAPP_URL?: string
  readonly VITE_SHEETS_USER_ID?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
