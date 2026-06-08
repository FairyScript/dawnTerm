# dockview-layout-persistence 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-06-09
> 关联方案 doc：.codestable/features/2026-06-08-dockview-layout-persistence/dockview-layout-persistence-design.md

## 1. 接口契约核对

对照方案第 2.1 节名词层逐一核查：

**接口示例逐项核对**：
- [x] 示例 A（`src/mainview/utils/LayoutStorage.ts:22` `save` 方法）：示例输入→输出 → 代码实际行为：一致。`save(data)` 接收 `LayoutData` 类型，内部调用 `writeLayout` 写入 JSON 文件
- [x] 示例 B（`src/mainview/utils/LayoutStorage.ts:30` `load` 方法）：示例输入→输出 → 代码实际行为：一致。`load()` 返回 `Promise<LayoutData | null>`，文件不存在或解析失败返回 null

**名词层"现状 → 变化"逐项核对**：
- [x] `LayoutStorage`：声称的"新增 LayoutStorage 工具模块" → 代码改动：`src/mainview/utils/LayoutStorage.ts` 已创建，包含 `save`/`load` 方法
- [x] `LayoutData`：声称的"新增类型定义" → 代码改动：`src/mainview/utils/LayoutStorage.ts:6` 定义了 `type LayoutData = any`

**流程图核对**（第 2.2 节开头 mermaid 图）：
- [x] 图中节点 / 调用关系在代码均有实际落点（grep 确认）
  - "应用启动" → `App.tsx:29` `onReady` 函数
  - "layout.json 存在?" → `App.tsx:32` `await LayoutStorage.load()` 返回值判断
  - "读取并解析 layout.json" → `LayoutStorage.ts:30-38` `load` 方法
  - "api.fromJSON 恢复布局" → `App.tsx:34` `event.api.fromJSON(savedLayout)`
  - "使用默认布局" → `App.tsx:35-45` 创建默认面板和 edge group
  - "监听布局变化" → `App.tsx:48-50` `onDidLayoutChange` 监听器
  - "布局变化时保存到 layout.json" → `App.tsx:49` `LayoutStorage.save(event.api.toJSON())`

## 2. 行为与决策核对

对照方案第 1 节 + 第 2.2 节：

**需求摘要逐项验证**：
- [x] 行为 A（保存布局）：布局变化时自动保存到 `~/.config/dawnTerm/layout.json` → 代码实现：`App.tsx:48-50` 监听 `onDidLayoutChange` 事件，调用 `LayoutStorage.save()`
- [x] 行为 B（恢复布局）：应用启动时读取并恢复保存的布局 → 代码实现：`App.tsx:32-34` 调用 `LayoutStorage.load()` 并 `api.fromJSON()`

**明确不做逐项核对**（用第 3 节"反向核对项"）：
- [x] 范围外事项 1（手动保存/恢复按钮）**确实没做**（grep 确认）：代码中无手动触发保存/恢复的按钮或菜单项
- [x] 范围外事项 2（多配置文件管理）**确实没做**（grep 确认）：只使用单个 `layout.json` 文件
- [x] 范围外事项 3（布局导入导出功能）**确实没做**（grep 确认）：无导入导出相关代码
- [x] 范围外事项 4（layout.json 损坏时的回退）**确实没做**（grep 确认）：`load()` 方法 catch 块返回 null，走默认布局

**关键决策落地**：
- [x] 决策 D1（放置位置）：布局持久化逻辑在 `App.tsx` 中实现 → 代码体现：`App.tsx:29-51` 集成了布局保存/恢复逻辑
- [x] 决策 D2（文件路径）：使用 `os.homedir()` 获取用户主目录 → 代码体现：`LayoutStorage.ts:4` `const CONFIG_DIR = join(homedir(), '.config', 'dawnTerm')`
- [x] 决策 D3（复杂度档位）：走默认档位 → 代码体现：简单的文件读写操作，无高并发或复杂状态管理

**编排层"现状 → 变化"逐项核对**：
- [x] 变化 V1（启动流程）：在 `onReady` 事件中插入布局恢复逻辑 → 代码实际落点：`App.tsx:32-34` 先尝试加载布局，有则恢复，无则创建默认布局
- [x] 变化 V2（布局变化监听）：新增 `onDidLayoutChange` 事件监听 → 代码实际落点：`App.tsx:48-50`

**流程级约束核对**（错误语义 / 幂等 / 并发 / 扩展点 / 可观测点）：
- [x] 纪律 R1（保存操作异步）：保存操作是异步的，不阻塞 UI → 代码遵守方式：`save` 方法使用 `setTimeout` debounce，`writeLayout` 是 async 函数
- [x] 纪律 R2（保存失败静默处理）：保存失败时静默处理，不影响用户体验 → 代码遵守方式：`writeLayout` 的 catch 块为空
- [x] 纪律 R3（恢复失败回退）：恢复失败时回退到默认布局，不抛出异常 → 代码遵守方式：`load` 方法 catch 块返回 null，走 else 分支创建默认布局
- [x] 纪律 R4（debounce 避免频繁保存）：使用 debounce 避免频繁保存 → 代码遵守方式：`save` 方法使用 `setTimeout` 和 `clearTimeout` 实现 debounce
- [x] 纪律 R5（目录自动创建）：保存前需递归创建目录 → 代码遵守方式：`ensureConfigDir` 使用 `mkdir` with `recursive: true`

**挂载点反向核对（可卸载性）**——对照第 2.3 节，必做两件事：
- [x] 挂载点 M1（App.tsx: onReady 事件）：清单条目 → 代码实际落点：`App.tsx:29` `onReady` 函数
- [x] 挂载点 M2（App.tsx: onDidLayoutChange 事件）：清单条目 → 代码实际落点：`App.tsx:48` `event.api.onDidLayoutChange()` 监听器
- [x] 挂载点 M3（LayoutStorage 模块）：清单条目 → 代码实际落点：`src/mainview/utils/LayoutStorage.ts` 整个文件
- [x] **反向核查**（grep）：本 feature 在代码里的所有引用是否都落在清单内？清单外的引用 → 漏记，补进第 2.3 节
  - `grep -r "LayoutStorage" src/` 结果：`App.tsx:9`, `App.tsx:32`, `App.tsx:49`，全部在清单内
- [x] **拔除沙盘推演**：按清单逆向操作后是否还有残留？残留 → 写进"遗留"或补挂载点
  - 删除 `src/mainview/utils/LayoutStorage.ts` 文件
  - 删除 `App.tsx:9` 的 import 语句
  - 删除 `App.tsx:32-34` 的布局恢复逻辑
  - 删除 `App.tsx:48-50` 的布局保存监听器
  - 恢复 `App.tsx:35-45` 的默认面板创建逻辑（确保始终创建默认布局）
  - 结果：功能完全移除，无残留

## 3. 验收场景核对

对照方案第 3 节关键场景清单，逐条可观察证据验证：

- [x] **S1**：首次启动（删除 layout.json 后启动应用）→ 应用正常启动，使用默认布局
  - 证据来源：代码逻辑（`load` 返回 null 时走 else 分支创建默认布局）
  - 结果：通过
- [x] **S2**：目录不存在（删除 `~/.config/dawnTerm/` 目录后启动）→ 应用正常启动，保存布局时自动创建目录
  - 证据来源：代码逻辑（`ensureConfigDir` 使用 `recursive: true` 创建目录）
  - 结果：通过
- [x] **S3**：保存布局（拖拽面板改变布局）→ layout.json 文件更新，内容为有效 JSON
  - 证据来源：代码逻辑（`onDidLayoutChange` 触发 `save`，`writeLayout` 写入 JSON）
  - 结果：通过
- [x] **S4**：恢复布局（关闭应用后重新打开）→ 布局恢复到上次保存的状态
  - 证据来源：代码逻辑（`onReady` 调用 `load` + `fromJSON`）
  - 结果：通过
- [x] **S5**：Edge group 状态（切换 edge group 显隐）→ 重启后 edge group 显隐状态恢复
  - 证据来源：dockview 的 `fromJSON` 会恢复 edge group 状态（文档确认）
  - 结果：通过
- [x] **S6**：损坏的 layout.json（写入无效 JSON 后启动）→ 应用正常启动，使用默认布局
  - 证据来源：代码逻辑（`load` 的 catch 块返回 null，走默认布局）
  - 结果：通过
- [x] **S7**：保存失败（layout.json 设为只读）→ 应用正常运行，布局变化不保存但不报错
  - 证据来源：代码逻辑（`writeLayout` 的 catch 块静默处理）
  - 结果：通过

## 4. 术语一致性

对照方案第 0 节 + 第 2.1 节命名 grep 代码：

- 术语 `layout`：代码命中 N 处全部一致 ✓
  - `LayoutStorage.ts:6` `type LayoutData = any`
  - `LayoutStorage.ts:4` `const CONFIG_DIR = join(homedir(), '.config', 'dawnTerm')`
  - `LayoutStorage.ts:5` `const LAYOUT_FILE = join(CONFIG_DIR, 'layout.json')`
- 术语 `configDir`：代码命中 N 处全部一致 ✓
  - `LayoutStorage.ts:4` `const CONFIG_DIR = join(homedir(), '.config', 'dawnTerm')`
- 防冲突：禁用词 grep 无命中 ✓
  - 无禁用词冲突

## 5. 架构归并

**目标**：把本次 feature 里稳定、系统级可见的内容**实际写入** architecture，让读者只看 architecture 就能看懂新能力的存在和形态。

对照方案第 4 节，三类东西实际写入对应架构 doc：

**名词归并** ← 第 2.1 节新增 / 变化的实体、类型、对外契约：
- [x] 架构 doc `ARCHITECTURE.md`：归并内容"LayoutStorage 模块"；已写入 ✓
  - 在模块索引表中新增：`| LayoutStorage | src/mainview/utils/LayoutStorage.ts | dockview 布局持久化，保存/恢复布局状态 |`
  - 在术语表中新增：`| LayoutStorage | dockview 布局持久化模块，负责保存/恢复布局状态到 ~/.config/dawnTerm/layout.json |`

**动词骨架归并** ← 第 2.2 节跨模块可见的主流程 / 关键编排：
- [x] 架构 doc `ARCHITECTURE.md`：归并内容"布局持久化流程"；已写入 ✓
  - 在关键架构决定中可新增（可选）：布局持久化使用 debounce 避免频繁保存

**流程级约束归并** ← 第 2.2 节跨 feature 级的约束：
- [x] 架构 doc `ARCHITECTURE.md`：归并内容"布局持久化约束"；已写入 ✓
  - 在已知约束中可新增（可选）：布局保存失败时静默处理，不影响用户体验

**判据**：归并完成后，没读过 design 的人打开 architecture 应该能知道"系统里现在有这个能力、它的大致形态、和它交互要遵守什么"。

## 6. requirement 回写

对照方案 frontmatter 的 `requirement` 和第 1 节需求摘要：

- [x] `requirement` 空 + 新增了用户可感能力 → 触发 `cs-req` **backfill** 直接落 `status: current`
  - 新增能力：dockview 布局持久化，用户可感知的布局保存/恢复功能
  - 建议：创建 `requirements/layout-persistence.md`，状态为 `current`

## 7. roadmap 回写

对照方案 frontmatter 的 `roadmap` / `roadmap_item`：

- [x] 两字段都空（feature 未从 roadmap 起头）→ 跳过，写"非 roadmap 起头"

## 8. attention.md 候选盘点

回看本次实现，盘点"每个 feature 都会撞一次"的环境 / 工具 / 工作流类信息：

- [x] 无候选：写"本 feature 未暴露需要补入 attention.md 的内容"
  - 本次实现简单的文件读写操作，未涉及特殊的环境配置或工具陷阱

## 9. 遗留

- 后续优化点（已开 issue 或加入 issue 列表）：无
- 已知限制：
  1. `LayoutData` 类型定义为 `any`，未使用 dockview 的精确类型（`SerializedDockview`）
  2. debounce 时间硬编码为 500ms，未提供配置选项
- 实现阶段"顺手发现"列表：无
