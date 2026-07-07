# 标题栏拖动失效

> 日期: 2026-06-08

## 根因

`TitleBar.tsx` 的 `titlebar-drag` div 被添加了 `electrobun-webkit-app-region-no-drag` class（在集成 DropdownMenu 时），导致该区域无法拖动。

## 修复

1. 从 `titlebar-drag` div 移除 `electrobun-webkit-app-region-no-drag`
2. 在 DropdownMenu 的 MenuButton 上添加 `electrobun-webkit-app-region-no-drag`，确保菜单可点击

## 教训

Electrobun 的 drag/no-drag 区域划分需要精确：容器设 `drag`，仅交互子元素设 `no-drag`。改交互区域时检查 drag 属性。
