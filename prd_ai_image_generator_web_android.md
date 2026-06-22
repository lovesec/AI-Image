# PRD：AI 图片生成平台（Web + Android）

## 1. 项目背景
- 目标用户希望通过输入业务需求，调用 `gpt-image-2` 自动生成高质量营销图（宣传海报、电商产品图等），并减少 Prompt 编写成本。
- 现有问题：
  - Prompt 设计复杂，输出风格不稳定；
  - 缺少行业、素材类型的统一标准；
  - Web 与 Android 体验不一致；
  - 缺少邀请码、配额、审计与复用机制。

## 2. 产品目标
1. 提供“输入需求 + 模板化提示词 + GPT 图片生成”的一站式图片生产体验；
2. 支持行业与素材类型分流（海报、电商主图、社媒图、横幅图、封面图）；
3. 上线邀请码和免费/付费配额机制，支持活动引流；
4. 支持用户在安全边界内追加/自定义 Prompt；
5. Web 与 Android 使用同一后端能力与数据模型，实现一致结果；
6. 提供稳定的历史记录、重生成和下载链路。

## 3. 目标用户
- 电商商家/店长：高频出图，要求白底、清晰、规范比例；
- 运营人员：需要活动海报、社媒图，强调创意与文案；
- 小微企业主：缺设计资源，需要快速落地视觉物料；
- 自媒体/课程创作者：需要稳定可复用的视觉资产。

## 4. 核心指标（MVP）
1. 7 日新用户完成首单生成率 ≥ 30%；
2. 生成请求提交到任务完成成功率 ≥ 95%；
3. 首周回访生成率（再次生成）≥ 40%；
4. 邀请码激活成功率 ≥ 20%；
5. 自定义提示词开启率 ≥ 25%；
6. 安卓端首屏到结果页平均耗时 ≤ 8 秒（模型异步排队前端可见）。

## 5. 功能范围（V1）
### 5.1 In Scope
- 用户登录（邮箱/手机号）；
- 素材类型与行业选择；
- 模板化 Prompt 生成；
- 邀请码激活与配额扣减；
- 可选自定义提示词（追加模式）；
- 一键生成（1~4 张）、重绘/变体、下载；
- 结果历史查询与详情查看；
- Web 与 Android 同步调用同一 API；
- 基础失败重试与错误提示；
- 管理端（内测）：
  - 邀请码管理（创建、停用、配额配置）；
  - 提示词模板配置（按类型/行业）；
  - 提示词库导入与分类规则配置；
  - 用户配额与状态基础管理；
  - 任务与失败率监控看板。

### 5.2 Out of Scope（V1）
- 团队协作/多角色；
- A/B 分析系统；
- 企业级品牌资产治理（字体库、色卡库）。
- 复杂多层级企业权限（V1 先支持 admin / ops）。

## 6. 用户故事
1. 运营同学选择“海报 + 教育行业”，输入标题、口号、风格，点击生成即可拿到多张海报。
2. 店铺运营选择“电商主图”，输入产品信息后获得白底主图，支持“改色”再生成功能。
3. 推广用户输入邀请码后自动获得新额度并开始体验。
4. 进阶用户追加自定义提示词，得到更符合品牌调性的输出。
5. 用户在历史页查看某次任务参数并一键改文案重生。

## 7. 需求详述

### 7.1 素材分类与行业分流（核心）
1. 素材类型（type）：
   - poster：宣传海报
   - product_shot：电商产品图
   - social_post：社媒图
   - banner：横幅图
   - cover：活动封面
2. 行业维度（industry）：
   - ecommerce / food / education / fitness / travel / finance / beauty / tech
3. 输入字段（最小集）：
   - title（主标题）
   - subtitle（副标题/卖点）
   - cta（行动按钮文案，可选）
   - color_style（色系）
   - ratio（比例）
4. 最终拼接规则：
   - `final_prompt = base_style + type_prompt + industry_prompt + user_fields + safe_negative_prompt + custom_override`
5. 自动建议：
   - 对 title/subtitle 做关键词命中（如“主图/sku/白底”）时建议用户选定最可能类型；
   - 支持一键修正。

### 7.2 邀请码体系
1. 邀请码字段：
   - code、code_type（活动码/渠道码/体验码）、quota_total、quota_used、expire_at、plan_override、max_uses_per_user、created_by、status
2. 使用规则：
   - 首次激活绑定用户；
   - 生成时按“邀请码 > 用户月配额”顺序扣减；
   - 可支持按次数与按日期双重失效；
   - 同一用户重复提交同码在单账户可设置上限。
3. 统计需求：
   - 激活数、消耗数、转化率（激活→生成次数）、剩余额度。

### 7.3 自定义提示词
1. 模式：
   - 基础：追加提示词（推荐，安全）；
   - 高级：完整覆盖（仅高权限或实验室用户可见）。
2. 安全策略：
   - 长度限制；
   - 关键词过滤（watermark、版权、违法/低俗词）；
   - 显示拼接后最终提示词预览（可收起）。
3. 降级：
   - 一键恢复默认模板；
   - 无效输入回退到默认值并提示原因。

### 7.4 生成与重绘
1. 单次默认返回 3 张；
2. 支持功能：
   - reroll（重绘）；
   - variant（变体）；
   - “改文案重生”（保留其余参数）。
3. 下载：
   - 单图下载 PNG/JPG；
   - 历史集下载（v1 可先逐张）。

### 7.5 历史与审计
1. 每次任务记录：输入参数、最终 prompt、耗时、状态、配额来源（邀请码/套餐）；
2. 结果记录：图片 URL、尺寸、比例、模型版本；
3. 异常日志：超时、模型拒绝、参数错误、额度不足。

### 7.6 Web 体验要求
1. 三步完成生成：选择 -> 填写 -> 生成；
2. 表单支持字段联动（不同类型给出不同建议）；
3. 结果页支持卡片列表预览、放大查看、重绘按钮、下载；
4. 响应式适配，移动端可横向滑动图片。

### 7.7 Android 体验要求
1. 关键路径精简到 3 步内完成；
2. 核心入口固定在首页底部导航；
3. 网络慢时展示任务状态（队列中/生成中/失败）；
4. 默认高频比例优先：1:1、4:5、9:16；
5. 深色模式与浅色模式自适配（可选）。

### 7.8 管理后台（管理员）
1. 账号与权限
   - 管理后台登录（admin / ops）；
   - ops 可见基础运营数据与审核，admin 可管理关键配置与敏感操作；
   - 关键操作写入审计日志。
2. 提示词模板管理
   - 按 type / industry 查看模板列表；
   - 新增、编辑、停用模板；
   - 支持 `base_prompt`、`negative_prompt`、`industry_prompt`、比例白名单、safe rule 配置。
3. 提示词库管理
   - 文件上传（.md/.txt/.json）；
   - 文本/JSON 批量解析并预览分类；
   - 一键入库、去重、手工标签修正；
   - 支持打标签 `reviewed`、`disabled`、`owner=system/user`。
4. 用户与配额管理
   - 用户列表、状态、最近 7 天/30 天活跃度；
   - 冻结/解冻、配额补充/回收、配额变更原因记录；
   - 绑定邀请码使用明细查询。
5. 邀请码与运营配置
   - 管理码类型、总量、过期、单人上限；
   - 监控激活数、消耗数、每码转化率；
   - 配置按码类型开放素材类型限制。
6. 审计与监控
   - 管理行为日志（管理员操作）；
   - 任务监控（排队/生成中/完成/失败）；
   - 失败原因分布与超时报警。

## 8. 非功能需求
1. 接口一致性：Android/Web 复用同一 REST API；
2. 性能：接口 95 分位延迟 < 2 秒（不含模型推理）；
3. 成功率：非模型层请求成功率 ≥ 99.5%；
4. 安全：图片链接签名、过期控制、敏感词检测；
5. 可观测性：关键指标和错误码可追踪。

## 9. 数据模型（核心）
### 9.1 users
- id
- phone_or_email
- plan_id
- inviter_code_id（可空）
- quota_left
- created_at
- status（active/disabled）
- role（user/admin）

### 9.2 admins
- id
- user_id（关联 users）
- username
- role_level（admin/ops）
- last_login_at
- status

### 9.3 invite_codes
- id
- code
- code_type
- quota_total
- quota_used
- max_uses_per_user
- expire_at
- allow_types
- allow_industries
- plan_override
- created_by
- status

### 9.4 prompt_templates
- id
- name
- type
- industry
- base_prompt
- negative_prompt
- industry_prompt
- safe_prompt
- safe_rules
- allowed_sizes
- status

### 9.5 prompt_library
- id
- owner_user_id（可空：系统公共库）
- source_type（import/manual/reviewed）
- name
- prompt
- predicted_type
- type_confidence
- predicted_industry
- industry_confidence
- tags
- reviewed_flag
- disabled_flag
- custom_overrides
- created_at

### 9.6 jobs
- id
- user_id
- type
- industry
- input_payload
- final_prompt
- source（invite/coupon/plan）
- status
- error_code
- admin_note
- created_at

### 9.7 generated_assets
- id
- job_id
- image_url
- width
- height
- format
- file_size
- created_at

### 9.8 custom_overrides
- id
- user_id
- mode（append/override）
- custom_prompt
- approved_flag
- created_at

### 9.9 quota_logs
- id
- user_id
- action（grant/revoke/consume）
- amount
- reason
- operator_user_id
- ref_id
- created_at

### 9.10 admin_audit_logs
- id
- admin_user_id
- action
- target_type
- target_id
- memo
- created_at

## 10. 接口与权限建议（V1）
1. 用户端：
   - `POST /api/auth/login`
   - `POST /api/invite/activate`
   - `GET /api/templates`
   - `POST /api/generate`
   - `GET /api/jobs/{id}`
   - `GET /api/jobs/{jobId}/assets`
   - `GET /api/me/history`
2. 管理端：
   - `POST /api/admin/invite-codes`
   - `GET /api/admin/invite-codes`
   - `PUT /api/admin/invite-codes/{id}`
   - `PATCH /api/admin/invite-codes/{id}/status`
   - `GET /api/admin/invite-codes/stats`
   - `GET /api/admin/templates`
   - `PUT /api/admin/templates/{id}`
   - `GET /api/admin/users`
   - `GET /api/admin/users/{id}`
   - `POST /api/admin/users/{id}/quota`
   - `POST /api/admin/users/{id}/status`
   - `GET /api/admin/prompt-library`
   - `POST /api/admin/prompt-library/import`
   - `POST /api/admin/prompt-library/preview`
   - `PATCH /api/admin/prompt-library/{id}`
   - `GET /api/admin/audit-logs`
   - `GET /api/admin/jobs`

## 11. 风险与应对
1. 风险：自定义提示词导致风格漂移
   - 应对：V1 默认仅追加，禁用完整覆盖
2. 风险：邀请码被滥用
   - 应对：账号绑定、次数限制、异常监控
3. 风险：移动端重绘压力与下载体验差
   - 应对：缩略图优先渲染，逐张下载
4. 风险：行业命中不准
   - 应对：保留用户可改选；记录修正日志迭代规则
5. 风险：管理员误操作导致模板/配额异常
   - 应对：高风险接口加二次确认、操作审计、可回滚版本。
6. 风险：提示词库入库质量不可控导致生成质量下降
   - 应对：入库默认标记需审核，发布前需人工 Review。

## 12. 上线里程碑（建议）
1. 第 1 周：PRD 定稿、数据库建模、Prompt 模板库与分类规则
2. 第 2 周：Web 端核心流程与邀请码体系
3. 第 3 周：Android 基础页面与统一 API 接入
4. 第 4 周：管理后台基础功能（用户/邀请码/模板）
5. 第 5 周：提示词库导入审核流与风控参数
6. 第 6 周：日志/配额/风控联调与灰度发布

## 13. 迭代方向（V2）
1. 品牌知识库（统一色板/字体/Logo 约束）
2. 团队账号与共享模板
3. API 计费与企业套餐
4. 任务队列异步通知（Web 推送 / Android 通知）
