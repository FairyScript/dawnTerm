# dawn-term 架构总入口

> 状态：已初始化
> 创建日期：2026-06-08
> 最后更新：2026-06-08（name-dropdown-menu feature）

## 1. 项目简介

A simple terminal application built with Bun

技术栈：Bun + Electrobun + React 19 + TypeScript + Tailwind CSS 4

## 2. 核心概念 / 术语表

| 术语 | 定义 |
|------|------|
| TitleBar | 窗口顶部的标题栏组件，显示窗口标题和控制按钮 |
| 交通灯按钮 | macOS 原生的红黄绿窗口控制按钮（close/minimize/maximize） |
| hiddenInset | Electrobun 的 titleBarStyle 选项，隐藏标题栏但保留原生交通灯按钮 |
| DropdownMenu | 点击标题名后弹出的下拉菜单组件（基于 @headlessui/react） |
| SettingsPanel | 设置页面的 dockview 面板组件 |
| AboutPanel | 关于页面的 dockview 面板组件 |

## 3. 子系统 / 模块索引

| 模块 | 路径 | 职责 |
|------|------|------|
| 主进程 | `src/bun/index.ts` | 窗口创建、Electrobun 配置 |
| 主视图 | `src/mainview/` | React 应用入口、UI 组件 |
| TitleBar | `src/mainview/components/TitleBar.tsx` | 窗口标题栏组件，跨平台兼容，含下拉菜单触发 |
| DropdownMenu | `src/mainview/components/DropdownMenu.tsx` | 下拉菜单组件（@headlessui/react） |
| Dockview | `src/mainview/App.tsx` | 面板布局管理，api 持有与面板创建 |
| SettingsPanel | `src/mainview/components/panels/SettingsPanel.tsx` | 设置面板（占位） |
| AboutPanel | `src/mainview/components/panels/AboutPanel.tsx` | 关于面板（占位） |

## 4. 关键架构决定

1. **使用 Electrobun 框架**：跨平台桌面应用框架，支持 macOS/Windows/Linux
2. **选择 `titleBarStyle: "hiddenInset"`**：macOS 上保留原生交通灯按钮，符合平台习惯
3. **TitleBar 作为独立组件**：职责单一，便于维护和测试
4. **使用 Electrobun 窗口控制 API**：跨平台兼容，无需自己实现窗口控制逻辑

## 5. 已知约束 / 硬边界

- **跨平台窗口控制**：macOS 使用原生交通灯按钮，Windows/Linux 使用自定义按钮
- **标题栏可拖动**：使用 `-webkit-app-region: drag` CSS 属性，控制按钮区域需设置 `no-drag`
- **平台判断**：通过 `navigator.platform` 判断当前平台，决定是否渲染自定义控制按钮
- **dockview 面板去重**：创建面板前用 `api.getPanel(id)` 检查，已有则 `setActive()` 聚焦，不重复创建
- **主题变量**：自定义组件统一使用 `--dt-*` CSS 变量，不硬编码颜色值；变量定义在 `style.css` 的 `@theme` 块
