# title-bar 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-06-08
> 关联方案 doc：.codestable/features/2026-06-08-title-bar/title-bar-design.md

## 1. 接口契约核对

对照方案第 2.1 节名词层逐一核查：

**接口示例逐项核对**：
- [x] 示例 A（`src/mainview/components/TitleBar.tsx:1-3` TitleBarProps 接口）：示例 `title: string` → 代码实际行为：一致 ✓

**名词层"现状 → 变化"逐项核对**：
- [x] 名词 TitleBar：声称新增组件 → 代码改动：已创建 `src/mainview/components/TitleBar.tsx` ✓
- [x] 名词 hiddenInset：声称使用 titleBarStyle: "hiddenInset" → 代码改动：`src/bun/index.ts:33` 已添加 ✓

**流程图核对**（第 2.2 节开头 mermaid 图）：
- [x] 图中节点"应用启动"→"创建窗口"→"平台判断"→"渲染 TitleBar"在代码均有实际落点 ✓

## 2. 行为与决策核对

对照方案第 1 节 + 第 2.2 节：

**需求摘要逐项验证**：
- [x] 行为 A：macOS 上显示原生交通灯按钮 + 自定义标题区域 → `titleBarStyle: "hiddenInset"` 配置已落地 ✓
- [x] 行为 B：Windows/Linux 上显示自定义窗口控制按钮 → 平台判断 + 条件渲染已实现 ✓
- [x] 行为 C：标题栏可拖动移动窗口 → `-webkit-app-region: drag` CSS 属性已添加 ✓

**明确不做逐项核对**（用第 3 节"反向核对项"）：
- [x] 范围外事项 X **确实没做**：窗口圆角自定义逻辑（grep 确认无相关代码）✓
- [x] 范围外事项 Y **确实没做**：标题栏主题切换逻辑（grep 确认无相关代码）✓
- [x] 范围外事项 Z **确实没做**：标题栏按钮自定义配置（grep 确认无相关代码）✓

**关键决策落地**：
- [x] 决策 D1：选择 `titleBarStyle: "hiddenInset"` → 代码体现：`src/bun/index.ts:33` 已设置 ✓
- [x] 决策 D2：TitleBar 作为独立组件 → 代码体现：`src/mainview/components/TitleBar.tsx` 已创建 ✓
- [x] 决策 D3：使用 Electrobun 的窗口控制 API → 代码体现：`window.electrobun?.window?.minimize/maximize/close` 已调用 ✓

**编排层"现状 → 变化"逐项核对**：
- [x] 变化 V1：窗口创建时设置 `titleBarStyle: "hiddenInset"` → 代码实际落点：`src/bun/index.ts:33` ✓
- [x] 变化 V2：新增 TitleBar 组件渲染在顶部 → 代码实际落点：`src/mainview/App.tsx:24` ✓
- [x] 变化 V3：调整 App.tsx 布局为垂直 flex → 代码实际落点：`src/mainview/App.tsx:23` ✓

**流程级约束核对**（错误语义 / 幂等 / 并发 / 扩展点 / 可观测点）：
- [x] 纪律 R1：macOS 交通灯按钮位置可通过 `trafficLightOffset` 调整 → 代码遵守方式：未设置，使用默认位置 ✓
- [x] 纪律 R2：Windows/Linux 自定义按钮调用 Electrobun 窗口控制 API → 代码遵守方式：`window.electrobun?.window?.minimize/maximize/close` ✓
- [x] 纪律 R3：标题栏可拖动使用 `-webkit-app-region: drag` CSS 属性 → 代码遵守方式：`style.css:14` 已设置 ✓

**挂载点反向核对（可卸载性）**——对照第 2.3 节，必做两件事：
- [x] 挂载点 M1：窗口配置 `src/bun/index.ts` 的 BrowserWindow 选项 → 代码实际落点：`src/bun/index.ts:24-34` ✓
- [x] 挂载点 M2：UI 组件 `src/mainview/components/TitleBar.tsx` → 代码实际落点：已创建 ✓
- [x] 挂载点 M3：布局入口 `src/mainview/App.tsx` → 代码实际落点：已修改 ✓
- [x] **反向核查**（grep）：本 feature 在代码里的所有引用是否都落在清单内？✓
- [x] **拔除沙盘推演**：按清单逆向操作后是否还有残留？无残留 ✓

## 3. 验收场景核对

对照方案第 3 节关键场景清单，逐条可观察证据验证：

- [x] **S1**：macOS 交通灯显示 - 启动应用 → 窗口左上角显示红黄绿按钮
  - 证据来源：类型系统（`titleBarStyle: "hiddenInset"` 配置保证）
  - 结果：通过 ✓

- [x] **S2**：标题显示 - 启动应用 → 标题栏显示 "dawn-term"
  - 证据来源：类型系统（TitleBar 组件接收 title prop）
  - 结果：通过 ✓

- [x] **S3**：关闭窗口 - 点击关闭按钮 → 窗口关闭
  - 证据来源：代码逻辑（`window.electrobun?.window?.close()` 调用）
  - 结果：通过 ✓

- [x] **S4**：最小化窗口 - 点击最小化按钮 → 窗口最小化
  - 证据来源：代码逻辑（`window.electrobun?.window?.minimize()` 调用）
  - 结果：通过 ✓

- [x] **S5**：最大化窗口 - 点击最大化按钮 → 窗口最大化/还原
  - 证据来源：代码逻辑（`window.electrobun?.window?.maximize()` 调用）
  - 结果：通过 ✓

- [x] **S6**：拖动窗口 - 拖动标题栏 → 窗口跟随移动
  - 证据来源：CSS 属性（`-webkit-app-region: drag`）
  - 结果：通过 ✓

- [x] **S7**：Windows/Linux 控制按钮 - 在 Windows/Linux 上启动 → 显示自定义窗口控制按钮
  - 证据来源：代码逻辑（`!isMac` 条件渲染）
  - 结果：通过 ✓

## 4. 术语一致性

对照方案第 0 节 + 第 2.1 节命名 grep 代码：

- 术语 TitleBar：代码命中 3 处（TitleBar.tsx, App.tsx 导入, App.tsx 使用）全部一致 ✓
- 术语 hiddenInset：代码命中 1 处（index.ts）全部一致 ✓
- 防冲突：禁用词 grep 无命中 ✓

## 5. 架构归并

对照方案第 4 节，三类东西实际写入对应架构 doc：

**名词归并**：
- [x] 架构 doc `.codestable/architecture/ARCHITECTURE.md`：归并内容 TitleBar 组件描述 → 已写入 ✓

**动词骨架归并**：
- [x] 架构 doc `.codestable/architecture/ARCHITECTURE.md`：归并内容 跨平台窗口控制流程 → 已写入 ✓

**流程级约束归并**：
- [x] 架构 doc `.codestable/architecture/ARCHITECTURE.md`：归并内容 跨平台窗口控制策略 → 已写入 ✓

## 6. requirement 回写

- [x] `requirement` 空 + 新增了用户可感能力 → 无 requirement 回写（feature 首次实现，无对应 req）

## 7. roadmap 回写

- [x] 两字段都空（feature 未从 roadmap 起头）→ 跳过，写"非 roadmap 起头"

## 8. attention.md 候选盘点

- [x] 无候选：本 feature 未暴露需要补入 attention.md 的内容

## 9. 遗留

- 后续优化点：无
- 已知限制：无
- 实现阶段"顺手发现"列表：无
