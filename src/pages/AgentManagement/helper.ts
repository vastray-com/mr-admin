import dayjs from 'dayjs';
import type { Agent } from '@/typing/agent';

/** 从接口异常中提取可读错误信息 */
export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = err.response?.data?.message || err.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
};

/** 星期标签（索引即 `schedule_weekday`，0=周日） */
export const WEEKDAY_LABELS = [
  '周日',
  '周一',
  '周二',
  '周三',
  '周四',
  '周五',
  '周六',
];

/** 星期下拉选项 */
export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, value) => ({
  label,
  value,
}));

/** 调度类型下拉选项 */
export const SCHEDULE_TYPE_OPTIONS: {
  label: string;
  value: Agent.ScheduleType;
}[] = [
  { label: '按间隔', value: 'interval' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
];

/** 任务运行状态展示配置 */
export const TASK_RUN_STATUS_MAP: Record<
  string,
  { text: string; color: string }
> = {
  running: { text: '执行中', color: 'processing' },
  succeeded: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
};

/** 任务触发方式展示映射 */
export const TASK_TRIGGER_MAP: Record<string, string> = {
  scheduled: '定时',
  manual: '手动',
};

/** 格式化时间，空值返回占位符 */
export const formatTime = (value?: string | null): string =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

/** 把任务的调度规则格式化为可读文本 */
export const formatSchedule = (task: Agent.Task): string => {
  switch (task.schedule_type) {
    case 'interval':
      return `每 ${task.schedule_interval_minutes} 分钟`;
    case 'daily':
      return `每天 ${task.schedule_time}`;
    case 'weekly':
      return `${WEEKDAY_LABELS[task.schedule_weekday] ?? ''} ${task.schedule_time}`;
    default:
      return '-';
  }
};
