import { enumMapToOptions } from '@/utils/helper';

// 任务类型 one_time: 一次性任务 circular: 循环任务
export enum TaskType {
  // 一次性任务
  OneTime = 'one_time',
  // 循环任务
  Circular = 'circular',
}

const TYPE_MAP: Record<TaskType, string> = {
  [TaskType.OneTime]: '一次性任务',
  [TaskType.Circular]: '循环任务',
};

// 一次性任务类型 schedule: 定时任务 immediate: 立即执行
export enum OneTimeTaskType {
  // 定时任务
  Schedule = 'schedule',
  // 立即执行
  Immediate = 'immediate',
}

const ONE_TIME_TYPE_MAP: Record<OneTimeTaskType, string> = {
  [OneTimeTaskType.Schedule]: '定时执行',
  [OneTimeTaskType.Immediate]: '立即执行',
};

// 任务状态 disabled: 已停用 enabled: 启用中 waiting_init: 等待初始化
export enum TaskStatus {
  // 已停用
  Disabled = 'disabled',
  // 启用中
  Enabled = 'enabled',
  // 等待初始化
  WaitingInit = 'waiting_init',
}
const STATUS_DISPLAY: Record<TaskStatus, [string, string]> = {
  [TaskStatus.Disabled]: ['#D9D9D9', '已停用'],
  [TaskStatus.Enabled]: ['#52C41A', '已启用'],
  [TaskStatus.WaitingInit]: ['#FAAD14', '等待初始化'],
};

// 任务实例状态 pending: 待运行 running: 运行中 completed: 完成 failed: 失败 stopped: 停止 (手动停止) paused: 暂停
export enum TaskInstanceStatus {
  // 待运行
  Pending = 'pending',
  // 运行中
  Running = 'running',
  // 完成
  Completed = 'completed',
  // 失败
  Failed = 'failed',
  // 停止 (手动停止)
  Stopped = 'stopped',
  // 暂停
  Paused = 'paused',
}
const INSTANCE_STATUS_DISPLAY: Record<TaskInstanceStatus, [string, string]> = {
  [TaskInstanceStatus.Pending]: ['#EC622B', '待运行'],
  [TaskInstanceStatus.Running]: ['#108ee9', '运行中'],
  [TaskInstanceStatus.Completed]: ['#87d068', '运行完成'],
  [TaskInstanceStatus.Failed]: ['#BD342B', '运行失败'],
  [TaskInstanceStatus.Stopped]: ['#BFBFBF', '已停止'],
  [TaskInstanceStatus.Paused]: ['#F1BB59', '已暂停'],
};

// 任务推送状态 pending: 待运行 running: 运行中 completed: 完成 failed: 失败
// export enum TaskPushStatus {
//   // 0: 待运行
//   Pending = 0,
//   // 1: 运行中
//   Running = 1,
//   // 2: 完成
//   Completed = 2,
//   // 3: 失败
//   Failed = 3,
// }

export default {
  TYPE_MAP,
  TYPE_OPT: enumMapToOptions(TYPE_MAP),
  ONE_TIME_TYPE_MAP,
  ONE_TIME_TYPE_OPT: enumMapToOptions(ONE_TIME_TYPE_MAP),
  STATUS_DISPLAY,
  INSTANCE_STATUS_DISPLAY,
};
