# 下拉菜单与设置/关于面板设计

> 创建日期: 2026-06-08

## 需求

TitleBar 标题文字可点击弹出下拉菜单，包含"设置"和"关于"两项。设置打开 dockview tab，关于打开 floating panel。菜单通过 @headlessui/react 实现，统一定义 `--dt-*` 主题变量。

## 关键决策

1. **使用 `@headlessui/react` Menu 组件**：提供行为层（焦点管理、键盘导航、click-outside、aria），样式自定义
2. **统一主题变量 CSS Variables + Tailwind `@theme`**：在 `style.css` 中定义 `--dt-*` 变量，所有组件共享
3. **dockview api 通过 props 从 App 传入 TitleBar**：只有 TitleBar 需要，不引入 Context
4. **面板去重**：`api.getPanel(id)` 检查，已有则 `.api.setActive()` 聚焦

## 实现要点

- 新增 `DropdownMenu.tsx`（基于 Headless UI Menu）
- 新增 `SettingsPanel.tsx`、`AboutPanel.tsx` 占位面板
- `style.css` `@theme` 块定义 `--dt-bg-*`、`--dt-text-*`、`--dt-border`、`--dt-accent`、`--dt-danger`
- 所有自定义组件样式统一引用 `--dt-*` 变量，不硬编码颜色
