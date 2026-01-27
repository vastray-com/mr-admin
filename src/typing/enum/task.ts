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
  [OneTimeTaskType.Schedule]: '定时任务',
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
};
