// Keyboard shortcut utilities

export type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

export function registerKeyboardShortcut(shortcut: KeyboardShortcut, callback: () => void) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === shortcut.key &&
      (shortcut.ctrlKey ?? false) === (e.ctrlKey || e.metaKey) &&
      (shortcut.shiftKey ?? false) === e.shiftKey &&
      (shortcut.altKey ?? false) === e.altKey
    ) {
      e.preventDefault()
      callback()
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }
}

// Common shortcuts
export const shortcuts = {
  search: { key: "/", ctrlKey: true } as KeyboardShortcut,
  copy: { key: "c", ctrlKey: true } as KeyboardShortcut,
  upload: { key: "u", ctrlKey: true } as KeyboardShortcut,
}
