---
doc_type: issue-fix
issue: 2026-06-08-window-controls-broken
status: fixed
summary: 修复窗口控制按钮无效，补充双击标题栏切换最大化和拖拽恢复窗口模式
tags: [window-controls, rpc, electrobun]
---

# window-controls-broken Fix Note

## 问题根因

`src/bun/index.ts` 中 `windowRPC` 在 `mainWindow` 创建之前定义，导致 `minimizeWindow` 和 `maximizeWindow` 的 handlers 无法引用 `mainWindow`，handler 函数体为空。

## 修复内容

### 1. 修复窗口控制按钮无效

**文件**：`src/bun/index.ts`

**改动**：
- 使用 `let mainWindow: BrowserWindow | null = null` 延迟初始化
- `minimizeWindow` handler 调用 `mainWindow?.minimize()`
- `maximizeWindow` handler 实现切换逻辑：检查 `isMaximized()` 决定 `maximize()` 或 `unmaximize()`

### 2. 双击标题栏切换最大化

**文件**：`src/mainview/components/TitleBar.tsx`

**改动**：
- 在标题栏 div 添加 `onDoubleClick={handleDoubleClick}` 事件
- `handleDoubleClick` 调用 `electrobun.rpc?.send.maximizeWindow()`

### 3. 拖拽窗口时自动恢复窗口模式

**文件**：`src/bun/index.ts`

**改动**：
- 在 `mainWindow` 创建后添加 `move` 事件监听
- 当窗口移动时检查 `isMaximized()`，如果是则调用 `unmaximize()`

## 验证

- [x] 最小化按钮正常工作
- [x] 最大化按钮正常工作（切换逻辑）
- [x] 关闭按钮正常工作
- [x] 双击标题栏切换最大化/窗口化
- [x] 最大化后拖拽标题栏自动恢复窗口模式

## 关联提交

- feat: add custom title bar with cross-platform support
- fix: window controls RPC handlers now reference mainWindow
