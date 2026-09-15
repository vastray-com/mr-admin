/**
 * 工具调用参数的展示格式化。
 *
 * 目标：把工具入参渲染成「参数名 → 可读值」的列表，而不是直接输出 JSON 字符串。
 * 已知工具/参数走中文名与专用格式化，未知项回退为通用格式化。
 */

/** 单个可展示的入参项 */
export type ToolArgItem = {
  /** 原始参数名（列表 key） */
  key: string;
  /** 展示用参数名 */
  label: string;
  /** 展示用值文本 */
  value: string;
  /** 代码类值（SQL/标识符/路径），以等宽字体展示 */
  code?: boolean;
  /** 值较长（含换行或超长），展示时截断并以 title 提供全文 */
  long?: boolean;
};

/** 参数元信息：展示名、是否代码类，以及可选的专用格式化 */
type ArgMeta = {
  label: string;
  code?: boolean;
  /** 自定义格式化；返回 null 表示该参数不展示 */
  format?: (value: unknown) => string | null;
};

/** 判断是否为普通对象（排除数组与 null） */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const SCHEDULE_TYPES: Record<string, string> = {
  interval: '按间隔',
  daily: '每天',
  weekly: '每周',
};

/** 星期映射：0=周日 … 6=周六 */
const WEEKDAY_LABELS: Record<string, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
};

/** 标量转文本（字符串去空白、布尔转是/否） */
const asText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number')
    return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? '是' : '否';
  return '';
};

/** 对象值展开为 `k=v, k=v`（而非 JSON），无可展示字段返回 null */
const formatRecord = (record: Record<string, unknown>): string | null => {
  const parts = Object.entries(record)
    .map(([key, value]) => {
      const text = isRecord(value) ? formatRecord(value) : asText(value);
      return text ? `${key}=${text}` : '';
    })
    .filter((text) => text.length > 0);
  return parts.length > 0 ? parts.join(', ') : null;
};

/** 通用值格式化：字符串/数字/布尔/数组/对象，均不输出原始 JSON */
const formatArgValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const parts = value
      .map((item) =>
        isRecord(item) ? (formatRecord(item) ?? '') : asText(item),
      )
      .filter((text) => text.length > 0);
    return parts.length > 0 ? parts.join('、') : null;
  }
  if (isRecord(value)) return formatRecord(value);
  const text = asText(value);
  return text.length > 0 ? text : null;
};

/** 快捷构造纯文本参数元信息 */
const textArg = (label: string, code = false): ArgMeta => ({ label, code });

/** 数值型参数专用格式化（带单位） */
const numberWithUnit =
  (unit: string): ArgMeta['format'] =>
  (value) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${value} ${unit}`
      : null;

/** 枚举型参数专用格式化 */
const enumLabel =
  (labels: Record<string, string>): ArgMeta['format'] =>
  (value) =>
    typeof value === 'string' ? (labels[value] ?? value) : null;

/** 各工具的入参展示元信息（未知工具/参数走通用回退） */
const TOOL_ARG_META: Record<string, Record<string, ArgMeta>> = {
  warehouse_query: {
    sql: textArg('SQL', true),
    limit: textArg('返回行数上限'),
  },
  warehouse_list_tables: {
    keyword: textArg('过滤关键字'),
    limit: textArg('数量上限'),
  },
  warehouse_table_metadata: { table: textArg('表名', true) },
  read_file: { path: textArg('文件', true) },
  list_dir: { path: textArg('目录', true) },
  grep: { pattern: textArg('检索内容', true), path: textArg('目录', true) },
  skill_create: {
    name: textArg('技能名称'),
    description: textArg('简介'),
    content: textArg('指令正文'),
    enabled: textArg('启用'),
  },
  skill_update: {
    uuid: textArg('技能 ID', true),
    name: textArg('名称'),
    description: textArg('简介'),
    content: textArg('正文'),
    enabled: textArg('启用'),
  },
  task_get: { uuid: textArg('任务 ID', true) },
  task_create: {
    name: textArg('任务名称'),
    requirement: textArg('需求描述'),
    schedule_type: { label: '调度类型', format: enumLabel(SCHEDULE_TYPES) },
    schedule_interval_minutes: {
      label: '执行间隔',
      format: numberWithUnit('分钟'),
    },
    schedule_time: textArg('执行时刻'),
    schedule_weekday: {
      label: '星期',
      format: enumLabel(WEEKDAY_LABELS),
    },
    skill_uuids: textArg('绑定技能'),
    enabled: textArg('启用'),
  },
  task_set_enabled: {
    uuid: textArg('任务 ID', true),
    enabled: textArg('启用'),
  },
};

/** 未知参数名的回退展示：下划线转空格 */
const humanizeKey = (key: string): string => {
  const text = key.replace(/_/g, ' ').trim();
  return text.length > 0 ? text : key;
};

/**
 * 规范化工具入参：对象直接使用；字符串尝试按 JSON 解析（防止双端字符串化）。
 * @param raw 事件中的原始 args
 * @returns 参数对象；无法识别时返回 null
 */
export const normalizeToolArgs = (
  raw: unknown,
): Record<string, unknown> | null => {
  if (isRecord(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * 把工具入参整理为可展示项列表（已知参数按元信息顺序优先，其余按原始顺序追加）。
 * @param name 工具名
 * @param args 工具入参
 */
export const describeToolArgs = (
  name: string,
  args?: Record<string, unknown> | null,
): ToolArgItem[] => {
  if (!args) return [];
  const meta = TOOL_ARG_META[name] ?? {};
  const known = Object.keys(meta).filter((key) => key in args);
  const rest = Object.keys(args).filter((key) => !known.includes(key));
  const items: ToolArgItem[] = [];

  for (const key of [...known, ...rest]) {
    const metaItem = meta[key];
    const value = metaItem?.format
      ? metaItem.format(args[key])
      : formatArgValue(args[key]);
    if (!value) continue;
    items.push({
      key,
      label: metaItem?.label ?? humanizeKey(key),
      value,
      code: metaItem?.code,
      long: value.includes('\n') || value.length > 48,
    });
  }

  return items;
};
