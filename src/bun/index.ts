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

const windowRPC = BrowserView.defineRPC<WindowRPCType>({
  handlers: {
    requests: {},
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
      createTerminal: ({ panelId, cols, rows }) => {
        terminalManager.create(panelId, cols, rows)
      },
      resizeTerminal: ({ panelId, cols, rows }) => {
        terminalManager.resize(panelId, cols, rows)
      },
      closeTerminal: ({ panelId }) => {
        terminalManager.close(panelId)
      },
    },
  },
})

const rpcSend = windowRPC as any

const terminalManager = createTerminalManager((msg) => {
  if (!mainWindow) return
  if (msg.type === "output") {
    rpcSend.send.terminalOutput({
      panelId: msg.panelId,
      data: msg.data ?? "",
    })
  } else if (msg.type === "exit") {
    rpcSend.send.terminalExit({
      panelId: msg.panelId,
      exitCode: msg.exitCode ?? -1,
    })
  }
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
