import { lazy } from 'react';

// 任务管理
const TaskList = lazy(
  () => import('@/pages/TaskManagement/TaskList/TaskListPage'),
);
const TaskDetail = lazy(
  () => import('@/pages/TaskManagement/TaskDetail/TaskDetailPage'),
);
const TaskInstanceDetail = lazy(
  () =>
    import('@/pages/TaskManagement/TaskInstanceDetail/TaskInstanceDetailPage'),
);

// 结构化规则
const StructuredRulesetList = lazy(
  () =>
    import(
      '@/pages/RuleManagement/StructuredRulesetList/StructuredRulesetPage'
    ),
);
const StructuredRulesetDetail = lazy(
  () =>
    import(
      '@/pages/RuleManagement/StructuredRulesetDetail/StructuredRulesetDetailPage'
    ),
);

// 推送规则
const PushRuleList = lazy(
  () => import('@/pages/RuleManagement/PushRuleList/PushRulePage'),
);
const PushRuleDetail = lazy(
  () => import('@/pages/RuleManagement/PushRuleDetail/PushRuleDetailPage'),
);

// 码表
const EncodeTableList = lazy(
  () => import('@/pages/RuleManagement/EncodeTableList/EncodeTablePage'),
);
const EncodeTableDetail = lazy(
  () =>
    import('@/pages/RuleManagement/EncodeTableDetail/EncodeTableDetailPage'),
);

// 数据资产
const Dashboard = lazy(
  () => import('@/pages/DatasetManagement/Dashboard/DashboardPage'),
);
const DatasetList = lazy(
  () => import('@/pages/DatasetManagement/Dataset/DatasetList/DatasetListPage'),
);
const DatasetDetail = lazy(
  () =>
    import('@/pages/DatasetManagement/Dataset/DatasetDetail/DatasetDetailPage'),
);
const WarehouseDataPreview = lazy(
  () => import('@/pages/DatasetManagement/Warehouse/WarehouseDataPreview'),
);
const ExternalDataSourcePage = lazy(
  () =>
    import('@/pages/DatasetManagement/ExternalSource/ExternalDataSourcePage'),
);

// 数据项目
const DataProjectList = lazy(
  () => import('@/pages/DataProjectManagement/ProjectList/DataProjectListPage'),
);
const DataProjectDetail = lazy(
  () =>
    import('@/pages/DataProjectManagement/ProjectDetail/DataProjectDetailPage'),
);
const DataViewDetail = lazy(
  () => import('@/pages/DataProjectManagement/ViewDetail/DataViewDetailPage'),
);

// 数据标注
const AnnotationProjectList = lazy(
  () =>
    import(
      '@/pages/AnnotationManagement/ProjectList/AnnotationProjectListPage'
    ),
);
const AnnotationProjectDetail = lazy(
  () =>
    import(
      '@/pages/AnnotationManagement/ProjectDetail/AnnotationProjectDetailPage'
    ),
);
const AnnotationLibraryDetail = lazy(
  () =>
    import(
      '@/pages/AnnotationManagement/LibraryDetail/AnnotationLibraryDetailPage'
    ),
);

// 下载管理
const MyDownloadTask = lazy(
  () =>
    import('@/pages/DownloadTaskManagement/MyDownloadTask/MyDownloadTaskPage'),
);
const DownloadTaskList = lazy(
  () =>
    import(
      '@/pages/DownloadTaskManagement/DownloadTaskList/DownloadTaskListPage'
    ),
);
const DownloadTemplateList = lazy(
  () =>
    import(
      '@/pages/DownloadTaskManagement/DownloadTemplate/DownloadTemplatePage'
    ),
);

// 用户管理
const UserList = lazy(
  () => import('@/pages/UserManagement/UserList/UserListPage'),
);

// 系统管理
const TokenList = lazy(
  () => import('@/pages/SysManagement/TokenList/TokenListPage'),
);
const AuditLogList = lazy(
  () => import('@/pages/SysManagement/AuditLog/AuditLogPage'),
);

// 智能体
const AgentSkillList = lazy(
  () => import('@/pages/AgentManagement/Skills/AgentSkillPage'),
);
const AgentTaskList = lazy(
  () => import('@/pages/AgentManagement/Tasks/AgentTaskPage'),
);

// 文件工作区
const Workspace = lazy(
  () => import('@/pages/WorkspaceManagement/WorkspacePage'),
);

export default {
  StructuredRulesetList,
  StructuredRulesetDetail,
  PushRuleList,
  PushRuleDetail,
  EncodeTableList,
  EncodeTableDetail,
  TaskList,
  TaskDetail,
  TaskInstanceDetail,
  Dashboard,
  DatasetList,
  DatasetDetail,
  WarehouseDataPreview,
  ExternalDataSourcePage,
  AnnotationProjectList,
  AnnotationProjectDetail,
  AnnotationLibraryDetail,
  DataProjectList,
  DataProjectDetail,
  DataViewDetail,
  MyDownloadTask,
  DownloadTaskList,
  DownloadTemplateList,
  UserList,
  TokenList,
  AuditLogList,
  AgentSkillList,
  AgentTaskList,
  Workspace,
};
