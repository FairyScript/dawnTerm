import html from "../src/mainview/index.html"
import { resolve } from "path"
import { existsSync } from "fs"

const args = process.argv.slice(2)

let timeoutMs = 0
for (const arg of args) {
  if (arg.startsWith("--timeout=")) {
    timeoutMs = parseInt(arg.slice("--timeout=".length), 10) || 0
  }
}

const server = Bun.serve({
  routes: { "/": html },
  port: 3000,
})
console.log("Dev server running at http://localhost:3000")

const projectRoot = resolve(import.meta.dir, "..")
const electrobunBin =
  process.platform === "win32"
    ? resolve(projectRoot, "node_modules", ".bin", "electrobun.exe")
    : resolve(projectRoot, "node_modules", ".bin", "electrobun")

if (!existsSync(electrobunBin)) {
  console.error(`electrobun binary not found: ${electrobunBin}`)
  server.stop(true)
  process.exit(1)
}

const dllPath = resolve(projectRoot, "node_modules", "bun-pty", "rust-pty", "target", "release", "rust_pty.dll")

const electrobun = Bun.spawn([electrobunBin, "dev"], {
  stdio: ["inherit", "inherit", "inherit"],
  cwd: projectRoot,
  env: {
    ...process.env,
    BUN_PTY_LIB: dllPath,
  },
})

let cleaning = false
function cleanup() {
  if (cleaning) return
  cleaning = true
  electrobun.kill()
  server.stop(true)

  // Force exit after brief delay in case event loop is stuck
  setTimeout(() => process.exit(0), 300)
}

process.on("SIGINT", () => {
  cleanup()
  process.exit(0)
})

process.on("SIGTERM", () => {
  cleanup()
  process.exit(0)
})

if (timeoutMs > 0) {
  setTimeout(() => {
    console.log(`\nAuto-exiting after ${timeoutMs}ms`)
    cleanup()
    process.exit(0)
  }, timeoutMs)
}

electrobun.exited.then((code) => {
  if (cleaning) return
  console.log(`electrobun exited (code ${code})`)
  server.stop()
  process.exit(code ?? 0)
})
