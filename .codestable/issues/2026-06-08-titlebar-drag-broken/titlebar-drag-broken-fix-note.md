---
doc_type: issue-fix
issue: 2026-06-08-titlebar-drag-broken
status: fixed
severity: medium
tags: [ui, titlebar, drag, electrobun]
---

# titlebar-drag-broken fix note

## 问题

TitleBar 拖动移动窗口功能失效。

## 根因

`TitleBar.tsx:70` 的 `titlebar-drag` div 被添加了 `electrobun-webkit-app-region-no-drag` class（在集成 DropdownMenu 时），导致该区域无法拖动。

## 修复

1. 从 `titlebar-drag` div 移除 `electrobun-webkit-app-region-no-drag`
2. 在 DropdownMenu 的 MenuButton 上添加 `electrobun-webkit-app-region-no-drag`，确保菜单可点击

**改动文件**：
- `src/mainview/components/TitleBar.tsx:70` — 移除 `electrobun-webkit-app-region-no-drag`
- `src/mainview/components/DropdownMenu.tsx:17` — MenuButton 添加 `electrobun-webkit-app-region-no-drag`

## 验证

- TypeScript 编译通过
- 拖动功能恢复：点击 titlebar-drag 区域可拖动窗口
- 菜单功能保持：点击 DropdownMenu 可正常打开菜单
