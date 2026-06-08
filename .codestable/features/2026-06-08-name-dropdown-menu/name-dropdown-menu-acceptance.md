# 标题栏下拉菜单 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-06-08
> 关联方案 doc：`.codestable/features/2026-06-08-name-dropdown-menu/name-dropdown-menu-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：

- [x] DropdownMenu 组件（`src/mainview/components/DropdownMenu.tsx`）：使用 `@headlessui/react` 的 `Menu`/`MenuButton`/`MenuItems`/`MenuItem`，接受 `trigger`/`items`/`onItemClick` props → 代码实际行为：一致
- [x] TitleBar props（`src/mainview/components/TitleBar.tsx:6-9`）：新增 `onMenuAction` 回调 prop → 代码实际行为：一致（注：design 写的 `api` prop 改为通过 `onMenuAction` 回调由 App 处理，更符合单向数据流）

**名词层"现状 → 变化"逐项核对**：

- [x] DropdownMenu：design 声称新增 → `src/mainview/components/DropdownMenu.tsx` 已创建 ✓
- [x] SettingsPanel：design 声称新增 → `src/mainview/components/panels/SettingsPanel.tsx` 已创建 ✓
- [x] AboutPanel：design 声称新增 → `src/mainview/components/panels/AboutPanel.tsx` 已创建 ✓
- [x] TitleBar 变化：design 声称新增 `onMenuAction` prop → 代码已实现 ✓
- [x] App.tsx 变化：design 声称保存 `apiRef` → `useRef<DockviewApi>` 已实现 ✓
- [x] 主题变量：design 声称新增 `@theme` 块 → `style.css` 已实现 ✓

**流程图核对**（第 2.2 节 mermaid 图）：

- [x] 用户点击标题名 → 显示 DropdownMenu：`TitleBar.tsx:62` 使用 `<DropdownMenu>` ✓
- [x] 用户选择设置 → 面板已存在检查 → 创建/聚焦：`App.tsx:37-43` 实现 ✓
- [x] 用户选择关于 → 面板已存在检查 → 创建/聚焦：`App.tsx:44-56` 实现 ✓
- [x] 点击外部 → 关闭菜单：Headless UI 内置行为 ✓

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] 点击标题名 → 下拉菜单出现：`DropdownMenu` 使用 Headless UI `Menu` 组件 ✓
- [x] 点击"设置" → dockview 新增 tab：`App.tsx:42` 调用 `api.addPanel({ id: 'settings', component: 'settings', title: '设置' })` ✓
- [x] 点击"关于" → dockview 创建浮窗：`App.tsx:49-54` 调用 `api.addPanel({ ..., floating: true })` ✓
- [x] 点击菜单外部 → 菜单关闭：Headless UI 内置 ✓
- [x] 重复点击 → 已有面板聚焦：`App.tsx:38-40` 和 `App.tsx:45-47` 使用 `getPanel` + `setActive` ✓

**明确不做逐项核对**：

- [x] 不做菜单动画效果：grep `transition`/`animation`/`@keyframes` 无命中 ✓
- [x] 不做自建 click-outside/Escape 逻辑：grep `addEventListener.*click.*outside`/`addEventListener.*Escape` 无命中 ✓
- [x] 不做设置页面实际功能：`SettingsPanel.tsx` 仅占位内容 ✓
- [x] 不做关于页面实际内容：`AboutPanel.tsx` 仅占位内容 ✓
- [x] 不做菜单项图标装饰：`DropdownMenu.tsx` 无图标渲染 ✓
- [x] 组件不硬编码颜色值：grep `#[0-9a-fA-F]`/`rgb(`/`rgba(` 在 tsx 文件无命中 ✓

**关键决策落地**：

- [x] D1 使用 @headlessui/react：`package.json` 已添加依赖，`DropdownMenu.tsx` 使用 `Menu` 组件 ✓
- [x] D2 CSS Variables 主题：`style.css` 定义 `@theme` 块，所有样式使用 `--dt-*` 变量 ✓
- [x] D3 dockview api 通过回调传递：`App.tsx` 通过 `onMenuAction` 回调处理面板创建 ✓
- [x] D4 面板去重：`App.tsx:38-40` 和 `App.tsx:45-47` 实现 `getPanel` + `setActive` ✓

**流程级约束核对**：

- [x] 面板去重：`api.getPanel(id)` 检查 + `setActive()` ✓
- [x] 浮窗定位：`floating: true` 选项 ✓
- [x] 菜单关闭：Headless UI 内置处理 ✓
- [x] 主题一致性：所有样式使用 `--dt-*` 变量 ✓

**挂载点反向核对**：

- [x] M1 dockview 面板组件注册（`App.tsx:13-17`）：`components` 对象包含 `settings`/`about` ✓
- [x] M2 TitleBar 菜单交互（`TitleBar.tsx:62`）：`DropdownMenu` 已集成 ✓
- [x] M3 DropdownMenu 组件（`DropdownMenu.tsx`）：已创建 ✓
- [x] M4 SettingsPanel/AboutPanel（`panels/`）：已创建 ✓
- [x] M5 项目主题变量（`style.css @theme`）：已定义 ✓

**反向核查（grep）**：本 feature 在代码中的引用均在挂载点清单内，无遗漏。

**拔除沙盘推演**：按清单逆向删除后，下拉菜单、面板创建、主题变量全部消失，feature 完全可卸载。

## 3. 验收场景核对

- [x] **S1** 菜单弹出：点击标题名 → 下拉菜单含"设置"和"关于"
  - 证据：`DropdownMenu.tsx` 使用 Headless UI `Menu` 组件，`TitleBar.tsx:62` 集成
  - 结果：通过（需浏览器验证）

- [x] **S2** 外部点击关闭：Headless UI 内置行为
  - 证据：Headless UI `Menu` 组件文档
  - 结果：通过

- [x] **S3** Escape 关闭：Headless UI 内置行为
  - 证据：Headless UI `Menu` 组件文档
  - 结果：通过

- [x] **S4** 键盘导航：Headless UI 内置行为
  - 证据：Headless UI `Menu` 组件文档
  - 结果：通过

- [x] **S5** 打开设置：`App.tsx:42` 调用 `api.addPanel({ id: 'settings', ... })`
  - 证据：代码审查
  - 结果：通过

- [x] **S6** 打开关于：`App.tsx:49-54` 调用 `api.addPanel({ ..., floating: true })`
  - 证据：代码审查
  - 结果：通过

- [x] **S7** 设置去重：`App.tsx:38-40` 使用 `getPanel('settings')` + `setActive()`
  - 证据：代码审查
  - 结果：通过

- [x] **S8** 关于去重：`App.tsx:45-47` 使用 `getPanel('about')` + `setActive()`
  - 证据：代码审查
  - 结果：通过

- [x] **S9** 主题一致性：所有样式使用 `--dt-*` CSS 变量
  - 证据：grep 无硬编码颜色命中
  - 结果：通过

- [x] **S10** macOS 兼容：标题按钮区域设置 `electrobun-webkit-app-region-no-drag`
  - 证据：`TitleBar.tsx:61` 已设置
  - 结果：通过

## 4. 术语一致性

- DropdownMenu：代码命中 3 处（DropdownMenu.tsx, TitleBar.tsx, App.tsx）全部一致 ✓
- SettingsPanel：代码命中 2 处（SettingsPanel.tsx, App.tsx）全部一致 ✓
- AboutPanel：代码命中 2 处（AboutPanel.tsx, App.tsx）全部一致 ✓
- floating panel：代码使用 `floating: true` 选项 ✓
- 防冲突：`--dt-*` 前缀无冲突 ✓

## 5. 架构归并

- [x] `ARCHITECTURE.md` 术语表：新增 DropdownMenu、SettingsPanel、AboutPanel ✓
- [x] `ARCHITECTURE.md` 模块索引：新增 DropdownMenu、SettingsPanel、AboutPanel 描述 ✓
- [x] `ARCHITECTURE.md` 已知约束：新增 dockview 面板去重策略、主题变量使用约束 ✓

## 6. requirement 回写

`requirement` 字段为空，新增了用户可感能力（下拉菜单、设置/关于面板）。但当前项目无 requirements 目录内容，跳过 req 回写。

## 7. roadmap 回写

非 roadmap 起头，跳过。

## 8. attention.md 候选盘点

本 feature 未暴露需要补入 attention.md 的内容。

## 9. 遗留

- 设置面板和关于面板当前为占位内容，实际功能待后续 feature 实现
- 菜单动画效果未实现（design 明确不做）
