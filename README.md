# Excel DAG 可视化项目

## 项目结构
```
project/
├── backend/          # Spring Boot后端 (端口 8080)
└── frontend/         # React前端 (端口 5173)
```

## 快速开始

### 1. 启动后端
```bash
cd backend
./gradlew bootRun
```

### 2. 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 3. 访问
打开浏览器访问 http://localhost:5173

## Excel格式
| A列(源节点) | B列(目标节点) |
|------------|--------------|
| A          | B            |
| A          | C            |
| B          | D            |
| C          | D            |

上传Excel文件后，系统会自动解析节点和边关系，并使用Dagre算法进行自动布局渲染DAG。

## 验证
1. 后端启动成功后会监听8080端口
2. 前端启动后会监听5173端口
3. 访问页面，点击上传按钮，选择Excel文件
4. 验证DAG图是否正确渲染