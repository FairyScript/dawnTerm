# 窗口控制按钮无效

> 日期: 2026-06-08

## 根因

`src/bun/index.ts` 中 `windowRPC` 在 `mainWindow` 创建之前定义，导致 `minimizeWindow` 和 `maximizeWindow` 的 handlers 无法引用 `mainWindow`。

## 修复

1. 使用 `let mainWindow: BrowserWindow | null = null` 延迟初始化
2. `minimizeWindow` handler 调用 `mainWindow?.minimize()`
3. `maximizeWindow` handler 实现切换逻辑：`isMaximized()` → `unmaximize()` / `maximize()`

同时补充：
- 双击标题栏切换最大化（TitleBar `onDoubleClick`）
- 最大化状态下拖拽标题栏自动恢复窗口模式（`move` 事件监听 + `unmaximize()`）
