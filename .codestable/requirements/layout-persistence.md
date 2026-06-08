---
doc_type: requirement
slug: layout-persistence
pitch: 保存面板布局，下次打开自动恢复
status: current
last_reviewed: 2026-06-09
implemented_by:
  - ARCHITECTURE.md
tags:
  - dockview
  - persistence
  - layout
---

# 布局持久化

## 用户故事

- 作为 dawnTerm 用户，我希望调整面板布局后关闭应用，下次打开时布局自动恢复，而不是每次都要重新拖拽面板
- 作为 dawnTerm 用户，我希望首次启动时使用默认布局正常工作，而不是因为没有保存的布局而报错

## 为什么需要

dawnTerm 使用 dockview 管理面板布局，用户可以根据自己的工作习惯调整面板位置、大小和显隐状态。如果没有布局持久化功能，每次关闭应用后这些调整都会丢失，用户需要重复相同的布局操作，这会降低工作效率并影响使用体验。

## 怎么解决

当用户调整面板布局时，系统自动将布局状态保存到用户配置目录（`~/.config/dawnTerm/layout.json`）。下次启动应用时，系统会自动读取并恢复上次保存的布局。保存操作使用 debounce 机制避免频繁写入，保存失败时静默处理不影响用户体验。

## 边界

- 它不管什么：不提供手动保存/恢复按钮，不支持多配置文件管理，不提供布局导入导出功能
- 什么情况下别用它：当 dockview 版本升级导致布局格式不兼容时（假设版本不变）
- 用的前提：用户需要有写入 `~/.config/dawnTerm/` 目录的权限
