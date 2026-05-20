# 企业管理系统 - 财务收支管理

## 项目简介

这是一个前后端统一端口（15333）的全栈企业管理系统，专注于财务收支管理功能。系统使用 Node.js + Express 作为后端，MongoDB 作为数据库，前端采用原生 HTML/CSS/JavaScript 实现。

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MongoDB (通过 Mongoose ORM)
- **前端**: HTML5 + CSS3 + JavaScript (原生)
- **端口**: 15333 (前后端统一)

## 功能特性

### 财务收支管理字段

| 字段 | 说明 | 必填 |
|------|------|------|
| 类型 | 收入/支出 | ✓ |
| 金额 | 交易金额 | ✓ |
| 账户尾号 | 银行账户尾号 | ✓ |
| 账户名称 | 开户行名称 | ✓ |
| 余额 | 当前账户余额 | ✓ |
| 客户 | 客户名称 | ✗ |
| 所属合同 | 关联合同编号 | ✗ |
| 所属项目 | 关联项目名称 | ✗ |
| 摘要 | 交易摘要说明 | ✗ |
| 备注 | 备注信息 | ✗ |

### 核心功能

1. **新增收支记录** - 支持录入收入和支出交易
2. **查看交易列表** - 以表格形式展示所有交易记录
3. **编辑交易** - 修改已有的交易记录
4. **删除交易** - 删除不需要的交易记录
5. **统计面板** - 实时显示总收入、总支出、总余额和交易笔数

## 快速开始

### 环境要求

- Node.js >= 14
- MongoDB (可选，系统支持无数据库的演示模式)

### 安装步骤

```bash
# 进入项目目录
cd /workspace

# 安装依赖
npm install

# 启动服务
npm start
```

### 访问系统

服务启动后，在浏览器中访问：
- http://localhost:15333

API 端点：
- GET `/api/transactions` - 获取所有交易
- POST `/api/transactions` - 创建新交易
- PUT `/api/transactions/:id` - 更新交易
- DELETE `/api/transactions/:id` - 删除交易

## 数据库配置

### 使用本地 MongoDB

```bash
# 确保 MongoDB 正在运行
mongod --dbpath /data/db

# 设置环境变量（可选）
export MONGODB_URI="mongodb://localhost:27017/enterprise_management"

# 启动应用
npm start
```

### 演示模式（无数据库）

如果 MongoDB 不可用，系统会自动切换到演示模式，数据存储在内存中。重启服务器后数据会丢失。

## API 示例

### 创建交易记录

```bash
curl -X POST http://localhost:15333/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "收入",
    "amount": 10000,
    "accountSuffix": "8888",
    "accountName": "工商银行",
    "balance": 50000,
    "customer": "张三科技",
    "contract": "HT2024001",
    "project": "企业 ERP 系统",
    "summary": "首付款",
    "remark": "合同签订后支付"
  }'
```

### 获取所有交易

```bash
curl http://localhost:15333/api/transactions
```

### 更新交易

```bash
curl -X PUT http://localhost:15333/api/transactions/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000,
    "remark": "已确认收款"
  }'
```

### 删除交易

```bash
curl -X DELETE http://localhost:15333/api/transactions/{id}
```

## 项目结构

```
/workspace
├── index.js          # 后端服务器主文件
├── package.json      # 项目配置文件
├── public/
│   └── index.html    # 前端页面
└── README.md         # 项目说明文档
```

## 注意事项

1. 演示模式下数据存储在内存中，重启服务器会丢失
2. 生产环境请确保 MongoDB 正常运行
3. 建议在生产环境中添加用户认证和权限控制
4. 端口 15333 需要保持开放

## License

MIT
