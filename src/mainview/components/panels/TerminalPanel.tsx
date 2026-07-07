import { useEffect, useRef } from "react"
import type { IDockviewPanelProps } from "dockview-react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import { Unicode11Addon } from "@xterm/addon-unicode11"
import { LigaturesAddon } from "@xterm/addon-ligatures"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { Electroview } from "electrobun/view"
import type { WindowRPCType } from "../../../shared/types"

import "@xterm/xterm/css/xterm.css"

type OutputCb = (data: string) => void
type ExitCb = (exitCode: number) => void

const panelCallbacks = new Map<
  string,
  { onOutput: OutputCb; onExit: ExitCb }
>()

const rpc = Electroview.defineRPC<WindowRPCType>({
  handlers: {
    requests: {},
    messages: {
      terminalOutput: ({ panelId, data }) => {
        panelCallbacks.get(panelId)?.onOutput(data)
      },
      terminalExit: ({ panelId, exitCode }) => {
        panelCallbacks.get(panelId)?.onExit(exitCode)
      },
    },
  },
})

const electrobun = new Electroview({ rpc })

export function TerminalPanel(props: IDockviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const initializedRef = useRef(false)
  const panelId = props.api.id

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const container = containerRef.current
    if (!container) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily:
        "Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace",
      scrollback: 1000,
      allowProposedApi: true,
    })
    terminalRef.current = terminal

    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    terminal.loadAddon(fitAddon)

    try {
      terminal.loadAddon(new WebglAddon())
    } catch {
      // WebGL not available
    }

    terminal.loadAddon(new Unicode11Addon())
    terminal.unicode.activeVersion = "11"

    terminal.open(container)

    terminal.loadAddon(new LigaturesAddon())

    terminal.loadAddon(new WebLinksAddon())

    requestAnimationFrame(() => {
      fitAddon.fit()
    })

    const { cols, rows } = terminal
    electrobun.rpc?.send.createTerminal({ panelId, cols, rows })

    panelCallbacks.set(panelId, {
      onOutput: (data: string) => {
        terminal.write(data)
      },
      onExit: (exitCode: number) => {
        terminal.writeln(
          `\r\n\x1b[33m进程已退出，退出码: ${exitCode}\x1b[0m`,
        )
      },
    })

    terminal.onData((data) => {
      electrobun.rpc?.send.terminalInput({ panelId, data })
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      const dims = terminal
      electrobun.rpc?.send
        .resizeTerminal({ panelId, cols: dims.cols, rows: dims.rows })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      panelCallbacks.delete(panelId)
      terminal.dispose()
      electrobun.rpc?.send.closeTerminal({ panelId })
      initializedRef.current = false
    }
  }, [panelId])

  return <div ref={containerRef} className="terminal-container" />
}
