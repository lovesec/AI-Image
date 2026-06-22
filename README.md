# AI 图片生成平台（MVP）

本仓库包含一个最小可运行版本（Web + Android API 就绪）的实现。  
后端基于 Node.js 内置 `http`，无前端框架依赖；前端为纯 HTML/CSS/JS。

## 运行

```bash
npm start
```

### 本地部署（生产模式）

```bash
# 指定端口运行
PORT=3010 npm start

# 建议后台常驻
npm start > /tmp/ai-image-platform.log 2>&1 &
```

访问 `http://localhost:3010` 即可打开 Web 页面，Android 端请通过同网段地址调用 `http://<本机IP>:3010`。

如果你使用 `DEMO` 邀请码进行体验，请先启动后端后在页面输入 `DEMO2026`。

## 接口（Web 端和 Android 均可使用）

- `POST /api/auth/login`  
  请求体：`{ identity }`
- `GET /api/templates?type=poster&industry=ecommerce`
- `POST /api/prompt-preview`
- `POST /api/invite/activate`  
  请求体：`{ code }`
- `GET /api/prompt-library?type=...&industry=...`（需登录）
- `POST /api/prompt-library/import`（需登录，支持 `{ prompts, dryRun }`）
- `POST /api/prompt-library/classify`（需登录）
- `POST /api/generate`  
  请求体：
  ```json
  {
    "type": "poster|product_shot|social_post|banner|cover",
    "industry": "ecommerce|food|education|fitness|travel|finance|beauty|tech",
    "ratio": "1:1|4:5|16:9|9:16",
    "count": 1-4,
    "title": "...",
    "subtitle": "...",
    "cta": "...",
    "colorStyle": "...",
    "brandTone": "...",
    "customPrompt": "..."
  }
  ```
- `GET /api/jobs/:id`
- `GET /api/jobs/:id/assets`
- `POST /api/jobs/:id/reroll`
- `GET /api/me/history`

## 配置

- `OPENAI_API_KEY`：开启真实图片生成（未设置时将返回本地 SVG 占位图）
- `OPENAI_IMAGE_MODEL`：默认 `gpt-image-2`
- `JWT_SECRET`：Token 加密盐（生产环境请修改）
- `ADMIN_TOKEN`：创建邀请码接口授权码（`POST /api/admin/invite-codes`）
- `PORT`

## 说明

当前版本未接入数据库，使用本地 `src/state.json` 持久化数据。  
适合先跑通产品链路与体验验证，后续可以替换为 Postgres/MySQL。

## 下一步

1. 将 `state.json` 替换为数据库存储。  
2. 在 Android 侧新增一个简易客户端（登录、输入参数、展示图片）。  
3. 加上鉴黄与风控策略，补齐日志、管理后台。

## 提示词库使用

- 在界面「提示词库导入与分类」里输入文本、粘贴数组或上传 `.md/.txt/.json/.csv`。
- 点击「预览分类结果」查看每条提示词类型/行业自动推断。
- 点击「确认导入」将记录保存到当前用户下的 `promptLibrary`。
- 「我的提示词库」可按类型、行业筛选查看历史导入结果。
