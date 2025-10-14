import type { Dayjs } from 'dayjs';
import type { OneTimeTaskType, TaskStatus, TaskType } from '@/typing/enum';

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

  // 任务项
  type BaseItem = {
    // UUID
    uid: string;
    task_type: TaskType;
    rule_uid: string;
    status?: TaskStatus;
    // 执行时间类型，定时任务、立即执行，当任务类型为一次性任务时存在
    one_time_task_type?: OneTimeTaskType;
    // 循环任务的 cron 表达式
    cron?: string;
    // 执行次数
    exec_count: number;
    create_time?: string;
    update_time?: string;
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

  // 实例项
  type Instance = {
    // UUID
    uid: string;
    task_uid: string;
    // 0: 待运行, 1: 运行中, 2: 已完成 (成功), 3: 已完成 (失败)
    status: 0 | 1 | 2 | 3;
    task_start_time: string;
    task_duration: number;
    mr_total: number;
    mr_finish: number;
    mr_fail: number;
    create_time: string;
    update_time: string;
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
    output: string;
  };
}
