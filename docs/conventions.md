# 项目约定

项目约定、编码规范和已知注意事项

## 编译与构建

- 项目引入了 react-compiler（通过 `@zomme/bun-plugin-react-compiler`），注意遵守相关的代码规范

## 代码规范

- **面板/浮层统一用 dockview**：对话框 = 动态创建中间悬浮面板，设置页 = 新建 tab，不要用传统 modal/overlay
- 自定义组件样式统一使用 `--dt-*` CSS 变量，不硬编码颜色值
- 依赖相关的功能必须先查文档
