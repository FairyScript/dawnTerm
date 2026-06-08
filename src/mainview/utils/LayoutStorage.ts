import { join } from 'path'
import { homedir } from 'os'
import { mkdir, readFile, writeFile } from 'fs/promises'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LayoutData = any

const CONFIG_DIR = join(homedir(), '.config', 'dawnTerm')
const LAYOUT_FILE = join(CONFIG_DIR, 'layout.json')
const DEBOUNCE_MS = 500

let saveTimer: ReturnType<typeof setTimeout> | null = null

async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
}

async function writeLayout(data: LayoutData): Promise<void> {
  try {
    await ensureConfigDir()
    await writeFile(LAYOUT_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // 保存失败时静默处理
  }
}

export const LayoutStorage = {
  save(data: LayoutData): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      writeLayout(data)
      saveTimer = null
    }, DEBOUNCE_MS)
  },

  async load(): Promise<LayoutData | null> {
    try {
      const content = await readFile(LAYOUT_FILE, 'utf-8')
      return JSON.parse(content) as LayoutData
    } catch {
      // 文件不存在或解析失败时返回 null
      return null
    }
  },
}
