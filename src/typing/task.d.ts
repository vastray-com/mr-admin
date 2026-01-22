import type { Dayjs } from 'dayjs';
import type {
  OneTimeTaskType,
  TaskInstanceStatus,
  TaskPushStatus,
  TaskStatus,
  TaskType,
} from '@/typing/enum';

declare namespace Task {
  // 获取任务列表的参数
  type ListParams = PaginationParams;

  // 获取任务详情的参数
  type DetailParams = {
    task_uid: string;
  };

  // 操作任务的参数
  type ActionParams = {
    // UUID
    uid: string;
    action: 'enable' | 'disable' | 'delete';
  };

  // 停止实例
  type InstanceActionParams = {
    // 任务实例 UUID
    task_instance_uid: string;
  };

  // 任务项
  type BaseItem = {
    // UUID
    uid: string;
    name: string;
    status?: TaskStatus;
    task_type: TaskType;
    dataset_uid: string;
    dataset_name: string;
    // 推送规则 UUID 列表
    push_uids: string[];
    // 执行时间类型，定时任务、立即执行，当任务类型为一次性任务时存在
    one_time_task_type?: OneTimeTaskType;
    // 循环任务的 cron 表达式
    cron?: string;
    // 执行次数
    exec_count: number;
    deleted_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  type Item = {
    // 任务环境变量，JSON 字符串
    env_vars: Record<string, string>;
    // 执行时间，当任务类型为一次性任务且执行时间类型为定时任务时存在
    schedule_time?: string;
  } & BaseItem;
  type List = Item[];
  type CreateItem = {
    // 任务环境变量，JSON 字符串
    env_vars: [string, string][];
    // 执行时间，当任务类型为一次性任务且执行时间类型为定时任务时存在
    schedule_time?: Dayjs;
  } & BaseItem;

  // 获取任务实例列表的参数
  type InstanceListParams = PaginationParams & {
    task_uid: string;
  };

  // 重新执行任务示例推送参数
  type RePushParams = {
    task_instance_uid: string;
    push_rule_uid: string;
  };

  // 实例项
  type Instance = {
    // UUID
    uid: string;
    task_uid: string;
    start_time: string;
    duration: number;
    status: TaskInstanceStatus;
    failed_count: number;
    succeed_count: number;
    total_count: number;
    push_status: {
      push_rule_uid: string;
      // 实例状态 （0: 待运行 1: 运行中 2: 完成 3: 失败）
      status: TaskPushStatus;
      // 运行时长（秒）
      duration: number;
      // 备注
      remark: string[];
      // 推送时间
      push_time: string;
    }[];
    deleted_at: string;
    created_at: string;
    updated_at: string;
  };
  type InstanceList = Instance[];

  // 生成结果项
  type ResultListItem = {
    // UUID
    uid: string;
    task_uid: string;
    task_instance_uid: string;
    op_em_no: string;
    reg_date: string;
    visit_no: string;
    // 0: 未执行, 1: 已执行, 2: 执行失败
    is_execute: 0 | 1 | 2;
    date_time_start: string;
    date_time_end: string;
    create_time: string;
    update_time: string;
    input_summary: string;
  };
  type ResultList = ResultListItem[];
  type ResultDetail = {
    op_em_no: string;
    input: string;
    output: Record<string, string>[];
  };
}
