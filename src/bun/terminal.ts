import { spawn } from "bun-pty"
import type { IPty } from "bun-pty"

type SendMessage = (msg: {
  type: "output" | "exit"
  panelId: string
  data?: string
  exitCode?: number
}) => void

type ProcessEntry = {
  panelId: string
  pty: IPty
  onDataDispose: { dispose(): void }
  onExitDispose: { dispose(): void }
}

function getShell(): [string, string[]] {
  if (process.platform === "win32") {
    return ["pwsh.exe", []]
  }
  return [process.env.SHELL ?? "/bin/bash", []]
}

export function createTerminalManager(send: SendMessage) {
  const processes = new Map<string, ProcessEntry>()

  function create(
    panelId: string,
    cols: number,
    rows: number,
  ): string {
    const [shellCmd, shellArgs] = getShell()
    console.log(`[terminal] spawning: ${shellCmd} ${cols}x${rows}`)

    const pty = spawn(shellCmd, shellArgs, {
      name: "xterm-256color",
      cols,
      rows,
      cwd: process.cwd(),
    })

    const onDataDispose = pty.onData((data: string) => {
      send({ type: "output", panelId, data })
    })

    const onExitDispose = pty.onExit(({ exitCode }) => {
      console.log(`[terminal] ${shellCmd} exited with code ${exitCode}`)
      processes.delete(panelId)
      send({ type: "exit", panelId, exitCode })
    })

    processes.set(panelId, { panelId, pty, onDataDispose, onExitDispose })

    return panelId
  }

  function write(panelId: string, data: string): void {
    const entry = processes.get(panelId)
    if (!entry) return
    entry.pty.write(data)
  }

  function resize(panelId: string, cols: number, rows: number): void {
    const entry = processes.get(panelId)
    if (!entry) return
    entry.pty.resize(cols, rows)
  }

  function close(panelId: string): void {
    const entry = processes.get(panelId)
    if (!entry) return
    entry.onDataDispose.dispose()
    entry.onExitDispose.dispose()
    entry.pty.kill()
    processes.delete(panelId)
  }

  return { create, write, resize, close }
}

export type TerminalManager = ReturnType<typeof createTerminalManager>
