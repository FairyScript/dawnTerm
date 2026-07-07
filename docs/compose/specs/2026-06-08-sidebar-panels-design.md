# 面板侧边栏设计

> 创建日期: 2026-06-08

## 需求

dockview 开启左/底/右三个面板栏，TitleBar 增加三个切换按钮控制显隐。

## 关键决策

1. **使用 dockview edge groups 实现面板定位**：原生边缘面板系统，支持左/右/底三个位置
2. **面板显隐通过 `setEdgeGroupVisible` 实现**：无需销毁重建，保留面板状态
3. **切换按钮放在 TitleBar 右侧**：左侧已有下拉菜单

## 实现要点

- `api.addEdgeGroup('left', ...)` / `api.addEdgeGroup('bottom', ...)` / `api.addEdgeGroup('right', ...)`
- `api.setEdgeGroupVisible(position, visible)` 切换显隐
- 新增 `PanelToggle` 组件，使用 lucide-react 图标
- 按钮样式：可见时正常，不可见时降低透明度
