# P0 — 终端核心引擎 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 dockview 占位面板替换为可用的本地终端，实现 xterm.js 渲染 + Bun PTY 通信。

**Architecture:** Bun 主进程通过 `Bun.spawn({ pty: true })` 创建 PTY，stdout 通过 Electrobun RPC 推送到渲染进程的 xterm.js；用户输入通过 RPC 反向写入 PTY stdin。TerminalPanel 组件内嵌 xterm.js，通过 ResizeObserver 自适应面板尺寸。

**Tech Stack:** xterm.js 5.x + addons (fit, webgl, unicode11, ligatures, web-links), Bun PTY, Electrobun typed RPC

## Spec Covers

本计划覆盖 2026-07-07-development-roadmap-design.md 中的:
- [S2.1] xterm.js 集成
- [S2.2] PTY 通道
- [S2.3] 终端面板组件
- [S2.4] 基础交互能力
- [S2.5] RPC 类型扩展

## Global Constraints

- PTY shell: macOS/Linux 用 `$SHELL` 或 `/bin/bash`，Windows 用 `pwsh.exe` 或 `cmd.exe`
- xterm 默认 scrollback 1000 行
- 错误静默处理（与 LayoutStorage 风格一致）
- 使用 `--dt-*` CSS 变量，不硬编码颜色
- React Compiler 规则：不 mutate after render

---

### Task 1: 安装 xterm.js 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加 xterm.js 及 addons**

```bash
bun add @xterm/xterm @xterm/addon-fit @xterm/addon-webgl @xterm/addon-unicode11 @xterm/addon-ligatures @xterm/addon-web-links
```

- [ ] **Step 2: 验证安装**

Run: `bun install`
Expected: 无错误，`node_modules/@xterm/xterm` 存在

---

### Task 2: 扩展 RPC 类型

**Covers:** [S2.5]

**Files:**
- Modify: `src/shared/types.ts`

**Interfaces:**
- Produces: 终端 RPC 类型供 Task 3（main handlers）和 Task 5（TerminalPanel）消费

- [ ] **Step 1: 更新 `src/shared/types.ts`**

Replace the entire file:

```typescript
import type { RPCSchema } from "electrobun/bun"

export type WindowRPCType = {
  bun: RPCSchema<{
    requests: {
      createTerminal: {
        params: { panelId: string; cols: number; rows: number }
        response: { ptyId: string }
      }
      resizeTerminal: {
        params: { panelId: string; cols: number; rows: number }
        response: void
      }
      closeTerminal: {
        params: { panelId: string }
        response: void
      }
    }
    messages: {
      closeWindow: undefined
      minimizeWindow: undefined
      maximizeWindow: undefined
      startWindowDrag: { mouseX: number; mouseY: number }
      terminalInput: { panelId: string; data: string }
    }
  }>
  webview: RPCSchema<{
    requests: {}
    messages: {
      terminalOutput: { panelId: string; data: string }
      terminalExit: { panelId: string; exitCode: number }
    }
  }>
}
```

- [ ] **Step 2: 验证类型**

Run: `bunx tsc --noEmit`
Expected: 无类型错误

---

### Task 3: 创建 PTY 管理器

**Covers:** [S2.2]

**Files:**
- Create: `src/bun/terminal.ts`

**Interfaces:**
- Produces: `createTerminalManager(sendToWebview)` → `TerminalManager`
  - `create(panelId, cols, rows)` → `ptyId`
  - `write(panelId, data)` → `void`
  - `resize(panelId, cols, rows)` → `void`
  - `close(panelId)` → `void`
- Consumes: `WindowRPCType` from Task 2

- [ ] **Step 1: 创建 `src/bun/terminal.ts`**

```typescript
import type { Subprocess } from "bun"

type SendMessage = (msg: {
  type: "output" | "exit"
  panelId: string
  data?: string
  exitCode?: number
}) => void

interface PTYEntry {
  proc: Subprocess<"pipe", "pipe", "pipe">
  panelId: string
  cols: number
  rows: number
}

function getShell(): string[] {
  if (process.platform === "win32") {
    const pwsh = ["pwsh.exe", "powershell.exe", "cmd.exe"]
    return pwsh
  }
  return [process.env.SHELL ?? "/bin/bash"]
}

export function createTerminalManager(send: SendMessage) {
  const processes = new Map<string, PTYEntry>()

  async function create(
    panelId: string,
    cols: number,
    rows: number,
  ): Promise<string> {
    const shellCmd = getShell()[0]
    const shellArgs: string[] = []

    const proc = Bun.spawn([shellCmd, ...shellArgs], {
      pty: { cols, rows },
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env: process.env as Record<string, string>,
      cwd: process.cwd(),
    })

    const ptyId = panelId

    processes.set(ptyId, { proc, panelId, cols, rows })

    // Read stdout and send to webview
    const stdoutReader = proc.stdout.getReader()
    ;(async () => {
      try {
        while (true) {
          const { done, value } = await stdoutReader.read()
          if (done) break
          const text = new TextDecoder().decode(value)
          send({ type: "output", panelId, data: text })
        }
      } catch {
        // stream closed
      }
    })()

    // Read stderr and send to webview
    if (proc.stderr) {
      const stderrReader = proc.stderr.getReader()
      ;(async () => {
        try {
          while (true) {
            const { done, value } = await stderrReader.read()
            if (done) break
            const text = new TextDecoder().decode(value)
            send({ type: "output", panelId, data: text })
          }
        } catch {
          // stream closed
        }
      })()
    }

    // Handle process exit
    proc.exited.then((exitCode) => {
      processes.delete(ptyId)
      send({ type: "exit", panelId, exitCode })
    }).catch(() => {
      processes.delete(ptyId)
    })

    return ptyId
  }

  function write(panelId: string, data: string): void {
    const entry = processes.get(panelId)
    if (!entry) return
    const encoder = new TextEncoder()
    entry.proc.stdin.write(encoder.encode(data))
  }

  function resize(panelId: string, cols: number, rows: number): void {
    const entry = processes.get(panelId)
    if (!entry) return
    entry.cols = cols
    entry.rows = rows
    // Bun pty resize via kill SIGWINCH simulation
    // On Unix: kill with SIGWINCH; on Windows: ConPTY auto-handles via resize event
    if ("resize" in entry.proc && typeof (entry.proc as any).resize === "function") {
      ;(entry.proc as any).resize(cols, rows)
    }
  }

  function close(panelId: string): void {
    const entry = processes.get(panelId)
    if (!entry) return
    entry.proc.kill()
    processes.delete(panelId)
  }

  return { create, write, resize, close }
}

export type TerminalManager = ReturnType<typeof createTerminalManager>
```

- [ ] **Step 2: 验证编译**

Run: `bunx tsc --noEmit`
Expected: 无类型错误

---

### Task 4: 在主进程接入终端 RPC 处理器

**Covers:** [S2.2]

**Files:**
- Modify: `src/bun/index.ts`

**Interfaces:**
- Consumes: `createTerminalManager` from Task 3, RPC types from Task 2

- [ ] **Step 1: 修改 `src/bun/index.ts`**

Replace the file:

```typescript
import { BrowserWindow, BrowserView, Updater } from "electrobun/bun"
import type { WindowRPCType } from "../shared/types"
import { createTerminalManager } from "./terminal"

const DEV_SERVER_PORT = 3000
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel()
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" })
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.log("dev server not running.")
    }
  }
  return "views://mainview/index.html"
}

let mainWindow: BrowserWindow | null = null

const terminalManager = createTerminalManager((msg) => {
  const win = mainWindow
  if (!win) return
  if (msg.type === "output") {
    win.webview.rpc.send.terminalOutput({
      panelId: msg.panelId,
      data: msg.data ?? "",
    })
  } else if (msg.type === "exit") {
    win.webview.rpc.send.terminalExit({
      panelId: msg.panelId,
      exitCode: msg.exitCode ?? -1,
    })
  }
})

const windowRPC = BrowserView.defineRPC<WindowRPCType>({
  handlers: {
    requests: {
      createTerminal: async ({ panelId, cols, rows }) => {
        const ptyId = await terminalManager.create(panelId, cols, rows)
        return { ptyId }
      },
      resizeTerminal: async ({ panelId, cols, rows }) => {
        terminalManager.resize(panelId, cols, rows)
      },
      closeTerminal: async ({ panelId }) => {
        terminalManager.close(panelId)
      },
    },
    messages: {
      closeWindow: () => {
        process.exit(0)
      },
      minimizeWindow: () => {
        mainWindow?.minimize()
      },
      maximizeWindow: () => {
        if (mainWindow?.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow?.maximize()
        }
      },
      startWindowDrag: ({
        mouseX,
        mouseY,
      }: {
        mouseX: number
        mouseY: number
      }) => {
        if (mainWindow?.isMaximized()) {
          const currentFrame = mainWindow.getFrame()
          const restoredWidth = 900
          const restoredHeight = 700
          const relativeX = mouseX - currentFrame.x
          const ratioX = relativeX / currentFrame.width
          const newX = Math.round(mouseX - restoredWidth * ratioX)
          const newY = Math.round(mouseY - 16)
          mainWindow.unmaximize()
          mainWindow.setFrame(newX, newY, restoredWidth, restoredHeight)
        }
      },
      terminalInput: ({ panelId, data }) => {
        terminalManager.write(panelId, data)
      },
    },
  },
})

const url = await getMainViewUrl()

mainWindow = new BrowserWindow({
  title: "dawn-term",
  url,
  frame: {
    width: 900,
    height: 700,
    x: 200,
    y: 200,
  },
  titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
  rpc: windowRPC,
})

console.log("Tailwind Vanilla app started!")

mainWindow.webview.on("dom-ready", () => {
  fixWindowLayout(mainWindow!)
})

function fixWindowLayout(mainWindow: BrowserWindow) {
  const { width, height } = mainWindow.getFrame()
  mainWindow.setSize(width, height + 1)
  setTimeout(() => {
    mainWindow.setSize(width, height)
  }, 50)
}
```

- [ ] **Step 2: 验证编译**

Run: `bunx tsc --noEmit`
Expected: 无类型错误

---

### Task 5: 创建 TerminalPanel 组件

**Covers:** [S2.1], [S2.3], [S2.4]

**Files:**
- Create: `src/mainview/components/panels/TerminalPanel.tsx`
- Modify: `src/mainview/style.css`

**Interfaces:**
- Consumes: RPC types from Task 2
- Produces: `TerminalPanel(props: IDockviewPanelProps)` 组件供 Task 6 注册

- [ ] **Step 1: 创建 `src/mainview/components/panels/TerminalPanel.tsx`**

```typescript
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

const panelCallbacks = new Map<string, { onOutput: OutputCb; onExit: ExitCb }>()

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
      fontFamily: "Cascadia Code, Fira Code, JetBrains Mono, Consolas, monospace",
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
      // WebGL not available, fall back to canvas renderer
    }

    terminal.loadAddon(new Unicode11Addon())
    terminal.unicode.activeVersion = "11"

    terminal.loadAddon(new LigaturesAddon())

    terminal.loadAddon(new WebLinksAddon())

    terminal.open(container)

    // Fit on first render
    requestAnimationFrame(() => {
      fitAddon.fit()
    })

    // Send PTY dimensions on first connection
    const { cols, rows } = terminal
    electrobun.rpc?.request.createTerminal({ panelId, cols, rows }).catch(() => {})

    // Register output/exit callbacks
    panelCallbacks.set(panelId, {
      onOutput: (data: string) => {
        terminal.write(data)
      },
      onExit: (exitCode: number) => {
        terminal.writeln(`\r\n\x1b[33m进程已退出，退出码: ${exitCode}\x1b[0m`)
      },
    })

    // Forward user input to PTY
    terminal.onData((data) => {
      electrobun.rpc?.send.terminalInput({ panelId, data })
    })

    // ResizeObserver for panel resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      const { cols, rows } = terminal
      electrobun.rpc?.request.resizeTerminal({ panelId, cols, rows }).catch(() => {})
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      panelCallbacks.delete(panelId)
      terminal.dispose()
      electrobun.rpc?.request.closeTerminal({ panelId }).catch(() => {})
      initializedRef.current = false
    }
  }, [panelId])

  return (
    <div
      ref={containerRef}
      className="terminal-container"
    />
  )
}
```

- [ ] **Step 2: 添加终端 CSS（追加到 `src/mainview/style.css`）**

Append to the end of `src/mainview/style.css`:

```css
.terminal-container {
  width: 100%;
  height: 100%;
  padding: 4px;
  background-color: var(--dt-bg-dark);
}

.terminal-container .xterm {
  height: 100%;
}

.terminal-container .xterm-viewport {
  scrollbar-width: thin;
  scrollbar-color: var(--dt-bg-lighter) var(--dt-bg-dark);
}
```

Use the `edit` tool with `old_string` set to the last line of style.css and `new_string` as that line plus the new CSS.

- [ ] **Step 3: 验证编译**

Run: `bunx tsc --noEmit`
Expected: 无类型错误

---

### Task 6: 在 App 中注册终端面板并创建初始终端

**Covers:** [S2.3]

**Files:**
- Modify: `src/mainview/App.tsx`

**Interfaces:**
- Consumes: `TerminalPanel` 组件 from Task 5

- [ ] **Step 1: 修改 `src/mainview/App.tsx`**

Replace the file:

```typescript
import {
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
} from "dockview-react"
import type { DockviewApi } from "dockview-core"
import "dockview-react/dist/styles/dockview.css"
import { TitleBar } from "./components/TitleBar"
import { SettingsPanel } from "./components/panels/SettingsPanel"
import { AboutPanel } from "./components/panels/AboutPanel"
import { TerminalPanel } from "./components/panels/TerminalPanel"
import { useRef, useState } from "react"
import { PanelLeft, PanelBottom, PanelRight } from "lucide-react"
import { LayoutStorage } from "./utils/LayoutStorage"

const MyPanel = (props: IDockviewPanelProps) => {
  return <div style={{ padding: 16 }}>{props.api.title}</div>
}

const components = {
  default: MyPanel,
  settings: SettingsPanel,
  about: AboutPanel,
  terminal: TerminalPanel,
}

function App() {
  const apiRef = useRef<DockviewApi | null>(null)
  const [panelVisibility, setPanelVisibility] = useState({
    left: true,
    bottom: true,
    right: true,
  })

  const onReady = async (event: DockviewReadyEvent) => {
    apiRef.current = event.api
    let terminalId = 1

    const savedLayout = await LayoutStorage.load()
    if (savedLayout) {
      event.api.fromJSON(savedLayout)
    } else {
      event.api.addPanel({
        id: `terminal_${terminalId++}`,
        component: "terminal",
        title: "终端",
      })
      event.api.addEdgeGroup("left", { id: "left-edge", initialSize: 200 })
      event.api.addEdgeGroup("bottom", { id: "bottom-edge", initialSize: 150 })
      event.api.addEdgeGroup("right", { id: "right-edge", initialSize: 200 })
    }

    event.api.onDidLayoutChange(() => {
      LayoutStorage.save(event.api.toJSON())
    })
  }

  const handleMenuAction = (action: string) => {
    const api = apiRef.current
    if (!api) return

    if (action === "new-terminal") {
      let id = 1
      while (api.getPanel(`terminal_${id}`)) id++
      api.addPanel({
        id: `terminal_${id}`,
        component: "terminal",
        title: `终端 ${id}`,
      })
    } else if (action === "settings") {
      const existing = api.getPanel("settings")
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({ id: "settings", component: "settings", title: "设置" })
      }
    } else if (action === "about") {
      const existing = api.getPanel("about")
      if (existing) {
        existing.api.setActive()
      } else {
        api.addPanel({
          id: "about",
          component: "about",
          title: "关于",
          floating: true,
        })
      }
    }
  }

  const handlePanelToggle = (id: string) => {
    const api = apiRef.current
    if (!api) return

    const position = id as "left" | "bottom" | "right"
    const isVisible = api.isEdgeGroupVisible(position)

    api.setEdgeGroupVisible(position, !isVisible)
    setPanelVisibility((prev) => ({ ...prev, [id]: !isVisible }))
  }

  const panelItems = [
    {
      id: "left",
      icon: <PanelLeft size={14} />,
      visible: panelVisibility.left,
    },
    {
      id: "bottom",
      icon: <PanelBottom size={14} />,
      visible: panelVisibility.bottom,
    },
    {
      id: "right",
      icon: <PanelRight size={14} />,
      visible: panelVisibility.right,
    },
  ]

  return (
    <div className="flex flex-col h-screen">
      <TitleBar
        title="dawn-term"
        onMenuAction={handleMenuAction}
        panels={panelItems}
        onPanelToggle={handlePanelToggle}
      />
      <DockviewReact
        className="dockview-theme-abyss flex-1"
        onReady={onReady}
        components={components}
      />
    </div>
  )
}
export default App
```

- [ ] **Step 2: 更新菜单项，添加"新建终端"选项**

Modify `src/mainview/components/TitleBar.tsx` — change the `menuItems` array:

```typescript
const menuItems = [
  { id: "new-terminal", label: "新建终端" },
  { id: "settings", label: "设置" },
  { id: "about", label: "关于" },
]
```

- [ ] **Step 3: 验证编译**

Run: `bunx tsc --noEmit`
Expected: 无类型错误

---

### Task 7: 端到端验证

**Covers:** 全部 P0 交付标准

- [ ] **Step 1: 启动开发环境**

```bash
bun dev
```

Expected: 应用启动，显示默认终端面板

- [ ] **Step 2: 验证终端交互**

在终端面板中输入 `ls`（或者 Windows 上的 `dir`），按 Enter。
Expected: 显示当前目录的文件列表

- [ ] **Step 3: 验证自适应尺寸**

调整窗口大小或拖拽面板分隔线。
Expected: 终端内容自适应新尺寸（xterm 行列数更新）

- [ ] **Step 4: 验证多终端**

通过菜单"新建终端"创建第二个终端面板。
Expected: 两个终端面板独立工作，互不干扰

- [ ] **Step 5: 验证进程退出**

在终端中输入 `exit` 并按 Enter。
Expected: 终端显示黄色"进程已退出"消息
