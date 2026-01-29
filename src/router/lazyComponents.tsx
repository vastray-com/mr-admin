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

// 数据集管理
const DatasetList = lazy(
  () => import('@/pages/DatasetManagement/Dataset/DatasetList/DatasetListPage'),
);
const DatasetDetail = lazy(
  () =>
    import('@/pages/DatasetManagement/Dataset/DatasetDetail/DatasetDetailPage'),
);

// 用户管理
const UserList = lazy(
  () => import('@/pages/UserManagement/UserList/UserListPage'),
);

// 系统管理
const TokenList = lazy(
  () => import('@/pages/SysManagement/TokenList/TokenListPage'),
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
  DatasetList,
  DatasetDetail,
  UserList,
  TokenList,
};
