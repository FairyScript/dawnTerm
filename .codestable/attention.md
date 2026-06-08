# Attention

本文件是 CodeStable 技能启动必读的项目注意事项入口。所有 CodeStable 子技能开始工作前必须读取它。

## 项目碎片知识

<!-- cs-note managed: 用 cs-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

### 路径与目录约定

### 环境变量与凭证

### 依赖管理

- 涉及到依赖相关的功能必须先查文档

### 代码规范

- 项目引入了 react-compiler（通过 `@zomme/bun-plugin-react-compiler`），注意遵守相关的代码规范
- 所有新窗口和浮层功能统一用 dockview 实现：对话框 = 动态创建中间悬浮面板，设置页 = 新建 tab，不要用传统 modal/overlay

### 其他
