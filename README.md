# Excel DAG 可视化 - Webpack 版本

## 项目说明
本项目已从 Vite 迁移到 Webpack 5，用于解析 Excel 文件并可视化有向无环图。

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装项目依赖 |
| `npm run dev` | 启动开发服务器 (端口 5173) |
| `npm run build` | 生产环境构建 |
| `npm run build:dev` | 开发环境构建 |
| `npm run clean` | 清理 dist 目录 |

## 主要改动

1. **构建工具**: Vite → Webpack 5
2. **编译工具**: Babel 7 (支持 React 18)
3. **保持功能**:
   - 原有的开发服务器端口 (5173)
   - API 代理配置
   - React 18 + Antv G6 + XLSX
4. **新增**:
   - 代码分割优化
   - 生产环境压缩

## 项目结构

```
frontend/
├── src/
│   ├── main.jsx          # 应用入口
│   ├── App.jsx           # 主应用组件
│   └── components/
│       ├── DagGraph.jsx  # 图表组件
│       └── LoadingSpinner.jsx
├── index.html            # HTML 模板
├── webpack.config.js     # Webpack 配置
├── babel.config.js       # Babel 配置
└── package.json
```
