import type { RPCSchema } from "electrobun/bun"

export type WindowRPCType = {
  bun: RPCSchema<{
    requests: {}
    messages: {
      closeWindow: undefined
      minimizeWindow: undefined
      maximizeWindow: undefined
      startWindowDrag: { mouseX: number; mouseY: number }
      terminalInput: { panelId: string; data: string }
      createTerminal: { panelId: string; cols: number; rows: number }
      resizeTerminal: { panelId: string; cols: number; rows: number }
      closeTerminal: { panelId: string }
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
