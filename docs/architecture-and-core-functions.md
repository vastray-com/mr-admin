# Hippomind UI 技术架构与核心函数说明

## 1. 项目定位

`ui` 是一个基于 React + TypeScript 的临床数据资产管理前端，覆盖以下业务域：

- 数据资产：数据总览、数据查询、数据集管理
- 结构化规则：规则配置、规则字段编辑、规则测试
- 推送规则：结构化结果过滤与字段映射推送
- 结构化任务：任务初始化、执行、实例追踪
- 数据下载：申请、审批、导出下载
- 系统管理：用户、API 令牌、密码修改

---

## 2. 技术栈与工程配置

## 2.1 前端基础

- 框架：React 19
- 语言：TypeScript（严格模式）
- 构建：Vite 8（多环境输出目录：`dist/<mode>`）
- 路由：React Router 7（`createBrowserRouter` + loader）
- UI：Ant Design 6
- 状态管理：Zustand
- HTTP：Axios
- 样式：UnoCSS + 全局 CSS
- 图表：AntV G2
- 代码高亮：Shiki

## 2.2 关键配置文件

- `vite.config.ts`
  - `@` 指向 `src`
  - `/api` 代理到 `VITE_API_URL`
- `tsconfig.app.json`
  - `strict: true`
  - 使用 `paths` 映射 `@/*`
- `uno.config.ts`
  - 定义快捷类（如 `glass-bg`、`gradient-bg`）
  - 引入图标预设 `presetIcons`

---

## 3. 总体分层架构

系统按“页面层 -> 领域 Hook 层 -> 基础设施层 -> 类型层”组织。

- 页面层（`src/pages`）
  - 业务页面、业务弹窗、领域内表格/表单组件
- 通用组件层（`src/components`）
  - 布局、可编辑表格、通用表单封装、全屏加载
- Hook 层（`src/hooks`）
  - `useApi` 聚合所有后端接口
  - `usePaginationData` 统一分页拉取
  - `useFileImport`、`useDownloadDataset` 复用业务流程
- 路由层（`src/router`）
  - 公私路由、鉴权、菜单构建、懒加载
- 状态层（`src/store`）
  - 用户态、全局缓存（码表/规则/数据源 schema）
- 基础设施层（`src/utils`）
  - HTTP 拦截、本地存储、格式化、下载、高亮
- 类型层（`src/typing`）
  - API 泛型、分页泛型、领域模型、枚举映射

---

## 4. 运行时核心流程

## 4.1 应用启动

入口：`src/main.tsx`

1. 加载全局样式和 `initDayjs`
2. 渲染 `App`
3. `App` 内创建 `RouterProvider`，并以 `user.uid` 作为 `key`，用户态变化后强制重建路由树

## 4.2 路由与鉴权

关键文件：`src/router/route.tsx`、`src/router/privateRoutes.tsx`

- `publicLoader`
  - 已登录访问 `/login` 时重定向私有默认页
- `authLoader`
  - 无 token 则重定向登录
  - 首次登录态访问私有路由时执行 `initApp`
- `initApp`
  - 初始化 Shiki
  - 并发拉取码表、结构化规则、预设字段、推送规则、数据源 schema
  - 写入 `useCacheStore`

私有路由按角色过滤：

- `admin`：全量业务
- `user`：数据资产、结构化规则、我的下载

## 4.3 布局与菜单

关键文件：`src/components/PageLayout.tsx`

- 顶部：用户菜单、修改密码、退出登录
- 左侧：动态菜单，来源 `menuItems()`
- 内容区：`AnimatePresence + motion` 做页面切换动画
- 路由高亮：`getMenuStatus(pathname)` 支持参数路由匹配

## 4.4 状态与缓存

- `useUserStore`（`src/store/useUserStore.tsx`）
  - 用户信息同步 `localStorage`
- `useCacheStore`（`src/store/useCacheStore.tsx`）
  - 缓存并预计算下拉选项
  - 含 `encodeTableOptions`、`structuredRulesetOptions`、`pushRuleOptions`

## 4.5 请求层

关键文件：`src/utils/service.ts`、`src/hooks/useApi.tsx`

- `service`：统一拦截器
  - 请求时注入 `Bearer token`
  - 响应统一返回 `response.data`
  - `401` 自动清理登录态并跳转登录（特例路径除外）
  - `403` 统一提示无权限
- `noInterceptorsService`
  - 用于下载流等场景（`blob`）
- `useApi`
  - 聚合任务、数据集、下载、规则、用户、系统、仓库接口

---

## 5. 业务域架构说明

## 5.1 数据资产域

### 数据查询（Warehouse）

- 页面：`src/pages/DatasetManagement/Warehouse/WarehouseDataPreview.tsx`
- 核心能力：
  - 多层级过滤器构建（`DatasetFilterForm`）
  - AI 生成过滤条件（`datasetApi.genAIFilter`）
  - 过滤器 FE/DB 结构转换（`datasetFilterFE2DB`）
  - 数据预览与患者详情联动（`WarehouseDataTable` + `WarehousePatientDetailModal`）

### 数据集列表

- 页面：`src/pages/DatasetManagement/Dataset/DatasetList/DatasetListPage.tsx`
- 核心能力：
  - 卡片化展示数据集
  - 复制数据集（复用创建弹窗）
  - 下载入口（普通下载 / 质控下载）

### 数据集详情

- 页面：`src/pages/DatasetManagement/Dataset/DatasetDetail/DatasetDetailPage.tsx`
- 核心能力：
  - 数据集元信息与过滤器展示（JSON / 表单可切换）
  - 关联结构化规则维护
  - 患者明细预览（前 1000）

### 数据总览

- 页面：`src/pages/DatasetManagement/Dashboard/DashboardPage.tsx`
- 可视化组件：`LineChart`、`BarChart`、`PieChart`
- 按科室 + 时间过滤拉取聚合数据

## 5.2 结构化规则域

### 规则列表

- 页面：`src/pages/RuleManagement/StructuredRulesetList/StructuredRulesetPage.tsx`
- 能力：查询、导入（文本/文件）、导出、创建、删除

### 规则详情编辑

- 页面：`src/pages/RuleManagement/StructuredRulesetDetail/StructuredRulesetDetailPage.tsx`
- 子组件：`FieldTable`
- 能力：
  - 基本信息编辑
  - 字段表格编辑（排序、快移、复制、删除）
  - 预设字段/自定义字段插入
  - 保存前业务校验（字段名重复、映射合法性）
  - 模型提取测试与 curl 生成
  - 字段树预览（`Preview`）

## 5.3 推送规则域

### 推送规则列表

- 页面：`src/pages/RuleManagement/PushRuleList/PushRulePage.tsx`
- 能力：查询、导入导出、创建、删除

### 推送规则详情

- 页面：`src/pages/RuleManagement/PushRuleDetail/PushRuleDetailPage.tsx`
- 子组件：`FilterTable`、`PushTable`
- 能力：
  - 关联结构化规则后拉取字段
  - 配置过滤条件（源字段/操作符/值）
  - 配置推送字段映射（含数据类型、长度、枚举映射）

## 5.4 码表域

- 列表：`src/pages/RuleManagement/EncodeTableList/EncodeTablePage.tsx`
- 详情：`src/pages/RuleManagement/EncodeTableDetail/EncodeTableDetailPage.tsx`
- 能力：导入导出、JSON 内容编辑、创建更新删除

## 5.5 任务域

- 列表：`src/pages/TaskManagement/TaskList/TaskListPage.tsx`
- 详情：`src/pages/TaskManagement/TaskDetail/TaskDetailPage.tsx`
- 实例：`src/pages/TaskManagement/TaskInstanceDetail/TaskInstanceDetailPage.tsx`
- 核心流程：
  - 任务初始化（一次性/循环、环境变量）
  - 启停任务
  - 任务实例分页追踪
  - 失败/运行状态管理、实例停止
  - 执行结果预览与详情抽屉

## 5.6 下载域

- 我的下载：`src/pages/DownloadTaskManagement/MyDownloadTask/MyDownloadTaskPage.tsx`
- 我的审批：`src/pages/DownloadTaskManagement/DownloadTaskList/DownloadTaskListPage.tsx`
- 弹窗：`src/components/Modal/downloadDatasetModal.tsx`
- 能力：下载申请、审批流转、导出重试、最终文件下载

## 5.7 用户与系统域

- 登录：`src/pages/Login/LoginPage.tsx`
- 用户管理：`src/pages/UserManagement/UserList/UserListPage.tsx`
- API 令牌：`src/pages/SysManagement/TokenList/TokenListPage.tsx`
- 密码修改：`src/components/Modal/ChangePwdModal.tsx`

---

## 6. 核心“类/实体”说明（TypeScript 命名空间）

项目没有传统 OOP class，核心实体通过 `namespace + type` 定义。

- `Dataset`（`src/typing/dataset.d.ts`）
  - 描述数据集、过滤器结构、规则关联、归档、AI 过滤输入
- `StructuredRuleset`（`src/typing/structuredRuleset.d.ts`）
  - 描述规则基础信息、字段模型、预设字段、规则测试参数
- `PushRule`（`src/typing/pushRule.d.ts`）
  - 描述推送规则、过滤条件、字段映射配置
- `Task`（`src/typing/task.d.ts`）
  - 描述任务、初始化参数、实例、结果明细
- `Warehouse`（`src/typing/warehose.d.ts`）
  - 描述数据源 schema、患者详情、总览聚合结构
- `DownloadTask` / `User` / `Tokens` / `EncodeTable`
  - 分别承载下载、用户、令牌、码表领域模型

---

## 7. 核心函数清单（按重要性）

| 函数/符号 | 文件 | 作用 |
|---|---|---|
| `routes()` | `src/router/route.tsx` | 构建全局路由树，挂接公私 loader |
| `initApp()` | `src/router/route.tsx` | 登录后一次性初始化全局缓存与高亮器 |
| `privateRoutes()` | `src/router/privateRoutes.tsx` | 按用户角色动态生成私有路由 |
| `menuItems()` / `getMenuStatus()` | `src/router/privateRoutes.tsx` | 侧边菜单渲染与路由选中态推导 |
| `useApi()` | `src/hooks/useApi.tsx` | 聚合全业务 API 调用入口 |
| `usePaginationData()` | `src/hooks/usePaginationData.tsx` | 通用分页数据拉取与刷新 |
| `datasetFilterFE2DB()` | `src/pages/DatasetManagement/helper.ts` | 将前端过滤器结构转后端结构 |
| `datasetFilterDB2FE()` | `src/pages/DatasetManagement/helper.ts` | 将后端过滤器结构转前端结构 |
| `downloadFile()` | `src/utils/helper.tsx` | 处理 blob 响应并触发下载 |
| `generateCurlExample()` | `src/utils/helper.tsx` | 生成规则测试 API 的 curl 样例 |
| `service.interceptors.*` | `src/utils/service.ts` | 统一 token 注入、鉴权失败跳转、错误处理 |
| `useCacheStore.set*` | `src/store/useCacheStore.tsx` | 全局缓存写入与下拉选项预计算 |

---

## 8. 页面-接口映射（核心）

- 数据集
  - 列表：`/dataset/list`
  - 详情：`/dataset/detail`
  - 创建/更新/删除：`/dataset/create`、`/dataset/update`、`/dataset/delete`
  - 关联规则：`/dataset/link_ruleset`
- 结构化规则
  - 列表/详情：`/structured_ruleset/list`、`/structured_ruleset/detail`
  - 测试：`/structured_ruleset/test`
- 推送规则
  - 列表/详情：`/admin/push_rule/list`、`/admin/push_rule/detail`
- 任务
  - 列表/详情：`/admin/task/list`、`/admin/task/detail`
  - 实例：`/admin/task/instance/*`
- 下载
  - 申请单列表：`/download_task/list`
  - 创建申请：`/download_task/create`
  - 审批更新：`/admin/download_task/update`
- 仓库
  - schema：`/warehouse/get_source_schema`
  - 明细：`/warehouse/get_source_data`
  - 总览：`/warehouse/get_dashboard_data`

---

## 9. 架构特点总结

- 前端以“领域页面 + 通用 Hook + 全局缓存”组织，边界清晰
- 路由 loader 承担了鉴权与初始化职责，避免页面重复请求
- 枚举 + 类型命名空间完整，保障复杂业务表单可维护性
- 可编辑表格能力抽象复用，支撑规则/推送规则的高密度配置场景
- 主要风险点在于：部分页面使用渲染阶段触发请求（通过 `useRef` 防抖），后续可统一迁移至 `useEffect` 提升可预测性
