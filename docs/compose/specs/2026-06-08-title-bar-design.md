# TitleBar 设计

> 创建日期: 2026-06-08

## 需求

为 dawnTerm 添加跨平台兼容的自定义 title bar，macOS 使用原生交通灯按钮，Windows/Linux 使用自定义窗口控制按钮。标题栏可拖动移动窗口。

## 关键决策

1. **选择 `titleBarStyle: "hiddenInset"`**：macOS 上保留原生交通灯按钮，符合平台习惯
2. **TitleBar 作为独立组件**：职责单一，便于维护
3. **使用 Electrobun 的窗口控制 API**：跨平台兼容，无需自己实现窗口控制逻辑

## 实现要点

- 创建 `src/mainview/components/TitleBar.tsx`
- `src/bun/index.ts` 添加 `titleBarStyle: "hiddenInset"`
- 使用 `-webkit-app-region: drag` CSS 属性实现标题栏拖动
- 平台判断：`navigator.platform` 检测 macOS vs 其他平台
