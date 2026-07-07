# dockview 布局持久化设计

> 创建日期: 2026-06-08

## 需求

保存当前 dockview 面板布局到 `~/.config/dawnTerm/layout.json`，下次启动时自动恢复。

## 关键决策

- **自动保存**：监听 `onDidLayoutChange` 事件，debounce 500ms 后保存
- **静默失败**：保存失败不影响用户体验
- **默认布局兜底**：首次启动或文件损坏时使用硬编码默认布局
- **目录自动创建**：保存前 `mkdir -p` 确保配置目录存在

## 实现要点

- 新增 `src/mainview/utils/LayoutStorage.ts`
  - `LayoutStorage.save(api.toJSON())` — 写入 `~/.config/dawnTerm/layout.json`
  - `LayoutStorage.load()` — 读取并解析，失败返回 null
- `App.tsx` `onReady` 中：先尝试加载，无则使用默认布局
- `App.tsx` `onDidLayoutChange` 中：debounce 后自动保存
