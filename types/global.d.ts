// Global type definitions

declare global {
  interface Window {
    netlifyIdentity: {
      on: (event: string, callback: (user?: any) => void) => void
      open: (command?: string) => void
    }
  }
}

export {}

