# dawnTerm 开发路线图

> 创建日期：2026-07-07
> 现状基线：项目已有自定义标题栏、dockview 面板布局、布局持久化、设置/关于占位面板。尚未实现任何终端功能。

## [S1] 项目定位

dawnTerm 是一个跨平台（Windows/macOS/Linux）桌面终端模拟器，基于 Bun + Electrobun + React 19 + Tailwind CSS 4 构建。

核心能力路径：
- **本地终端**: 直接启动系统 Shell（bash/zsh/pwsh/cmd 等），标准终端体验
- **远程终端**: 通过 SSH / Telnet 协议连接远程主机
- **文件管理**: SSH 会话附带的 SFTP 文件浏览与传输能力
- **插件扩展**: SSH、Telnet 等远程协议以内置插件形式接入，未来可扩展第三方插件

技术栈约束：
- 主进程: Bun + Electrobun（窗口管理、系统调用、PTY/网络）
- 渲染进程: React 19 + dockview-react（面板布局）+ Tailwind CSS 4
- 进程通信: Electrobun typed RPC
- 终端渲染: xterm.js（WebGL 加速的 ANSI 终端模拟库）

## [S2] P0 — 终端核心引擎

**目标**: 将 dockview 占位面板替换为可用的本地终端。

### [S2.1] xterm.js 集成
- 在 React 组件中嵌入 xterm.js Terminal 实例
- 配置 xterm.js addons: fit（自适应尺寸，随 dockview 面板 resize 变化）、webgl（渲染加速）、unicode（CJK/Emoji 宽度处理）、ligatures（连字字体）
- 终端面板注册为 dockview 组件类型 `terminal`

### [S2.2] PTY 通道（主进程 ↔ 渲染进程）
- Bun 主进程侧启动系统 PTY（pseudo-terminal），根据平台选择 shell:
  - macOS/Linux: `$SHELL` 或 `/bin/bash`
  - Windows: `pwsh.exe` 或 `cmd.exe`
- PTY 的 stdout/stderr → Electrobun message 推送到 webview → xterm.write()
- xterm.onData() 捕获用户输入 → Electrobun message 推送到 main → PTY stdin.write()
- 处理 PTY 进程退出事件，关闭对应终端面板或显示"进程已结束"提示
- 处理 PTY 进程的 resize（`pty.resize(cols, rows)` 同步到 xterm 尺寸变化）

### [S2.3] 终端面板组件 (TerminalPanel)
- 创建 `src/mainview/components/panels/TerminalPanel.tsx`
  - 使用 `useRef<HTMLDivElement>` 挂载 xterm.js
  - 监听 dockview panel resize 事件，调用 `fitAddon.fit()`
  - 通过 `Electroview.rpc.send` 发送输入，通过 `Electroview.rpc.onMessage` 接收输出
- 终端面板支持动态创建/关闭，dockview 原生管理多面板生命周期

### [S2.4] 基础交互能力
- 原生剪贴板读写: xterm 选中文本自动复制、右键粘贴（或 Ctrl+Shift+V）
- 滚动缓冲区: xterm 默认 scrollback 可配置（默认 1000 行）
- 链接检测: xterm addon-webLinks 自动识别 URL，Ctrl+Click 打开浏览器
- 光标样式: 支持 block/underline/bar，用户可切换

### [S2.5] RPC 类型扩展
- 扩展 `src/shared/types.ts` 中的 `WindowRPCType`:
  - `bun.messages` 新增: `terminalInput: { panelId: string; data: string }`
  - `webview.messages` 新增: `terminalOutput: { panelId: string; data: string }`、`terminalExit: { panelId: string; exitCode: number }`
  - `bun.requests` 新增: `createTerminal: { panelId: string; shell?: string; cwd?: string; cols: number; rows: number }` → `{ ptyId: string }`
  - `bun.requests` 新增: `resizeTerminal: { panelId: string; cols: number; rows: number }` → `void`
  - `bun.requests` 新增: `closeTerminal: { panelId: string }` → `void`

**交付标准**: 应用启动后创建本地终端面板，用户可输入命令并看到 shell 输出。

## [S3] P1 — 本地终端体验

**目标**: 从"能跑"升级为日常可用的终端应用。

### [S3.1] 终端设置面板
- 完善现有 SettingsPanel 占位组件，实现:
  - 外观: 字体族/字号（默认等宽）、配色方案（预设 + 自定义前景/背景/ANSI 16 色）、光标样式（block/underline/bar + 闪烁开关）
  - 行为: 滚动缓冲区行数、bell 声音开关、复制时自动选中
  - 设置存储: 通过主进程写入 `~/.config/dawnTerm/settings.json`，使用 debounce 保存（与 LayoutStorage 模式一致）
- 设置变更通过 RPC 推送到所有已打开的终端面板即时生效

### [S3.2] 快捷命令/热键窗口
- 类似 VS Code 的 Ctrl+Shift+P 命令面板
- 新建 dockview floating panel（`floating: true`，居中显示，自动聚焦搜索框）
- 内置命令: 新建终端、切换终端面板、打开设置、打开关于、重命名面板标题、关闭面板
- 搜索框支持模糊匹配，键盘上下选择，Enter 执行，Esc 关闭

### [S3.3] 终端内搜索
- xterm addon-search 集成
- 快捷键 Ctrl+Shift+F 打开 dockview floating panel（底部搜索栏），输入关键字后即时高亮
- 支持上下导航匹配项、大小写敏感切换、整词匹配切换
- 非遮挡终端内容区（在终端面板上方或内部嵌入搜索栏，而非全局浮层）

### [S3.4] 快捷键系统
- 定义快捷键注册表（`src/shared/shortcuts.ts`），支持以下默认绑定:
  | 快捷键 | 操作 | 作用域 |
  |---|---|---|
  | Ctrl+Shift+N | 新建终端面板 | 全局 |
  | Ctrl+Shift+W | 关闭当前终端面板 | 终端 |
  | Ctrl+Shift+F | 终端内搜索 | 终端 |
  | Ctrl+Shift+P | 命令面板 | 全局 |
  | Ctrl+Shift+, | 打开设置 | 全局 |
  | Ctrl+Shift+C | 复制选中文本 | 终端 |
  | Ctrl+Shift+V | 粘贴 | 终端 |
- 快捷键可通过设置面板自定义（P1 阶段仅支持默认绑定，自定义留到后续迭代）

### [S3.5] 会话快照
- 终端面板关闭时保存会话信息: shell 类型、cwd、环境变量
- 布局持久化扩展: 在现有 `layout.json` 中为每个 terminal 面板附加快照数据
- 下次恢复布局时，终端面板自动 cd 到上次的 cwd（通过 PTY 发送 `cd <path>\n`）
- 终端输出内容不保存（安全考虑，避免密码等敏感信息泄露）

**交付标准**: 日常开发工作中可替代系统自带终端使用。

## [S4] P2 — 远程协议接入

**目标**: 支持 SSH 和 Telnet 远程连接，以及 SSH 附带 SFTP 文件管理。

### [S4.1] SSH 连接管理
- 主进程集成 SSH 客户端库（推荐 `ssh2` npm 包，纯 JS 实现，支持密码/密钥/agent 认证）
- 创建连接管理器模块 `src/bun/ssh/connection.ts`:
  - 管理活跃 SSH 连接池（Map<connectionId, Client>）
  - 连接生命周期: connect → authenticate → ready → close
  - 支持密码认证、私钥认证（含加密私钥 + passphrase）、agent forwarding
  - 连接超时（默认 30s）、断线自动重连（可配置次数和间隔）
- RPC 接口:
  - `sshConnect: { id: string; host: string; port: number; username: string; auth: ... }` → `{ connected: boolean }`
  - `sshDisconnect: { id: string }` → `void`

### [S4.2] SSH 终端会话
- 基于已建立的 SSH 连接创建远程 Shell 会话（`client.shell()`）
- 数据流: xterm 输入 → RPC → SSH stream.write() → 远程 PTY
- 反向: SSH stream.on('data') → RPC → xterm.write()
- 复用 PTY 通道的 resize 和 exit 处理逻辑，SSH 会话视为 PTY 的远程变体

### [S4.3] 连接管理面板
- 新建 dockview 边缘面板（左侧 edge group）或 Tab 面板: ConnectionPanel
- 功能:
  - 连接列表: 显示已保存的连接配置（名称、主机、状态指示）
  - 添加/编辑/删除连接配置
  - 双击连接 → 新建终端面板并自动建立 SSH 连接
  - 连接状态指示: 绿点（已连接）、灰点（未连接）、红点（连接失败）
  - 右键菜单: 连接、断开、编辑、删除
- 配置存储: `~/.config/dawnTerm/connections.json`，结构:
  ```json
  { "connections": [{ "id": "xxx", "name": "My Server", "host": "192.168.1.1", "port": 22, "username": "root", "authType": "password" }] }
  ```
  **注意**: 密码不写入此文件（使用系统密钥链或内存存储），密钥路径保存引用而非内容

### [S4.4] SFTP 文件管理面板
- 基于同一 SSH 连接开启 SFTP 子会话（`client.sftp()`）
- 新建 dockview 面板组件 `SftpPanel`:
  - 双栏布局: 本地文件系统（左）+ 远程文件系统（右）
  - 文件列表: 树形目录导航 + 文件图标 + 名称/大小/修改时间列
  - 操作: 上传（拖拽或按钮）、下载、删除、重命名、新建文件夹、刷新
  - 进度条: 大文件传输时显示进度和速度
  - 路径导航栏: 面包屑式路径，支持手动输入路径并跳转
- 实现思路: 主进程通过 `ssh2.SFTP` 获取远程目录列表和文件流，渲染进程展示 UI

### [S4.5] Telnet 客户端
- 集成 Telnet 协议（Bun 原生 TCP socket 即可实现，或使用轻量 telnet 库）
- 与 SSH 终端复用同一 TerminalPanel 组件，仅底层传输层不同
- RPC 接口与 SSH 类似，但认证更简单（可选用户名/密码）
- 连接配置与 SSH 共享 ConnectionPanel 和 `connections.json`

### [S4.6] 密钥管理
- 使用系统原生密钥链存储敏感信息:
  - macOS: Keychain（通过 `security` CLI）
  - Windows: Credential Manager（通过 `cmdkey` CLI 或 win32 API）
  - Linux: `secret-tool` (libsecret) 或 fallback 到文件加密存储
- 连接密码、私钥 passphrase 均走密钥链，`connections.json` 不存明文

**交付标准**: 用户可通过 SSH/Telnet 连接远程主机并在终端面板中进行操作；SSH 连接可打开 SFTP 面板进行文件管理。

## [S5] P3 — 插件体系

**目标**: 将 SSH、Telnet 等远程协议重构为内置插件，建立可扩展的插件架构。

### [S5.1] 插件 API 设计
插件接口定义（`src/shared/plugin.ts`）:

```typescript
interface TerminalPlugin {
  id: string
  name: string
  version: string
  description?: string

  // 生命周期
  activate(ctx: PluginContext): void | Promise<void>
  deactivate(): void | Promise<void>

  // 能力声明
  capabilities: PluginCapability[]
}

interface PluginCapability {
  type: 'connection' | 'panel' | 'theme' | 'command'
  // connection: 提供远程协议实现
  // panel: 注册自定义 dockview 面板组件
  // theme: 提供配色方案/主题
  // command: 注册快捷命令
}

interface PluginContext {
  // 宿主提供的 API
  registerConnectionProvider(provider: ConnectionProvider): void
  registerPanel(id: string, component: ComponentType<IDockviewPanelProps>): void
  registerTheme(theme: TerminalTheme): void
  registerCommand(command: Command): void

  // 系统服务
  rpc: ElectroviewRPC
  config: PluginConfig
  logger: Logger
}
```

### [S5.2] 内置插件拆分
- `@dawnterm/plugin-ssh`: 将 P2 的 SSH / SFTP 实现包装为内置插件
- `@dawnterm/plugin-telnet`: 将 P2 的 Telnet 实现包装为内置插件
- `@dawnterm/plugin-local`: 将 P0/P1 的本地终端也包装为内置插件（统一接口）
- 插件通过主进程的 `PluginManager` 统一加载和管理生命周期

### [S5.3] 插件加载机制
- `src/bun/plugin/PluginManager.ts`: 负责扫描、加载、激活、停用插件
- 插件来源:
  - 内置插件: `src/plugins/` 目录，编译时打包
  - 外部插件: `~/.config/dawnTerm/plugins/` 目录，运行时动态加载（通过 Bun `import()`）
- 加载顺序: 内置插件 → 外部插件，后加载的插件可覆盖前者的面板/命令注册（同名冲突: last-wins）
- 错误隔离: 单个插件加载失败不影响其他插件和应用正常运行

### [S5.4] 主题扩展
- 在 `PluginCapability` 中通过 `type: 'theme'` 声明主题
- 插件可提供一组 `TerminalTheme`（终端配色方案: 前景色、背景色、ANSI 16 色、光标色）
- 主应用读取已注册主题，在设置面板的主题下拉列表中展示
- 支持导出/导入 `.json` 格式的主题文件（手动，非插件市场）

**交付标准**: 远程协议以插件形式内聚化，支持未来第三方开发终端扩展插件。

## [S6] 跨阶段关注事项

以下事项贯穿所有开发阶段，不是独立阶段，但每个阶段都需要考量：

### [S6.1] 跨平台兼容性
- 所有涉及系统调用（PTY、密钥链、文件路径）的逻辑需做平台分支:
  ```typescript
  if (process.platform === 'win32') { /* Windows 逻辑 */ }
  else if (process.platform === 'darwin') { /* macOS 逻辑 */ }
  else { /* Linux 逻辑 */ }
  ```
- 路径处理统一使用 `path` 模块，不用字符串拼接
- 快捷键适配平台差异: macOS 用 Cmd 替代 Ctrl

### [S6.2] 性能
- 终端渲染使用 xterm.js WebGL addon 确保大量输出不卡顿
- PTY 数据缓冲区限制: 避免主进程向渲染进程推送数据超阈值（如单帧超过 64KB 时分批发送）
- dockview 面板不可见时暂停 xterm 渲染（visibility change 事件）

### [S6.3] 安全
- 终端输入不做记录（不写日志文件），避免密码泄露
- SSH 密钥/密码通过系统密钥链管理
- 外部插件在沙箱环境中执行（P3 阶段评估 Bun Worker 或 vm2 可行性）
- 不信任远程主机发送的数据（ANSI 转义序列中可能包含恶意控制字符）

### [S6.4] 错误处理
- PTY 进程崩溃: 终端面板显示"进程异常退出"提示，不导致整个应用崩溃
- SSH 连接断开: 终端面板显示"连接已断开"，提供"重新连接"按钮
- 设置文件损坏: 回退到默认设置，记录警告日志
- 所有用户无感的错误静默处理（参考 LayoutStorage 的实现风格）

## [S7] 技术选型

| 模块 | 选型 | 理由 |
|---|---|---|
| 终端渲染 | xterm.js 5.x + addons | 最成熟的 web 终端库，WebGL 加速，社区活跃 |
| SSH 客户端 | ssh2 1.x | 纯 JS，无原生依赖，支持密钥/agent/代理 |
| Telnet | Bun TCP socket | Bun 原生 TCP 支持，无需额外依赖 |
| 文件操作 | Bun.file / node:fs | 跨平台路径处理 |
| 密钥存储 | keytar 或系统 CLI | 跨平台密钥链访问 |
| 插件沙箱 | Bun Worker | P3 阶段评估，轻量隔离 |

## [S8] 附录

### 现有代码改动影响范围预估

| 阶段 | 受影响文件 |
|---|---|
| P0 | `src/bun/index.ts`, `src/shared/types.ts`, `src/mainview/App.tsx`, 新增 `TerminalPanel.tsx` |
| P1 | `src/mainview/components/panels/SettingsPanel.tsx`, `src/mainview/App.tsx`, 新增 `CommandPalette.tsx`, `SearchBar.tsx`, `shortcuts.ts` |
| P2 | `src/bun/ssh/`, `src/shared/types.ts`, `src/mainview/App.tsx`, 新增 `ConnectionPanel.tsx`, `SftpPanel.tsx`, `connections.json schema` |
| P3 | `src/bun/plugin/`, `src/shared/plugin.ts`, `src/plugins/`, `src/bun/index.ts` |
