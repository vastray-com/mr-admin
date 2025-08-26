// 病历模版状态 1: 启用，0: 停用
export enum StructRuleStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}

// 模版字段来源类型
export enum StructRuleFieldSourceType {
  // LLM 大模型生成
  LLM = 1,
  // 原始数据字段引用
  QuoteOriginal,
  // 静态值
  Static,
  // 结构化数据字段引用
  QuoteResult,
}

export const structRuleFieldSourceTypeOptions = [
  { value: StructRuleFieldSourceType.LLM, label: '大模型生成' },
  { value: StructRuleFieldSourceType.QuoteOriginal, label: '原始数据引用' },
  { value: StructRuleFieldSourceType.Static, label: '静态值' },
  { value: StructRuleFieldSourceType.QuoteResult, label: '结构化结果引用' },
];

// 字段值类型
export enum StructRuleFieldValueType {
  // 文本
  Text = 1,
  // 日期
  Date,
  // 数字
  Number,
  // 数组
  Array,
  // 多字段
  Multi,
}

export const structRuleFieldValueTypeOptions = [
  { value: StructRuleFieldValueType.Text, label: '文本' },
  { value: StructRuleFieldValueType.Date, label: '日期' },
  { value: StructRuleFieldValueType.Number, label: '数字' },
  { value: StructRuleFieldValueType.Array, label: '数组' },
  { value: StructRuleFieldValueType.Multi, label: '多字段' },
];

// 字段映射类型
export enum StructRuleFieldMappingType {
  // 无
  None = 0,
  // 枚举
  Enum,
  // 码表
  Encode,
}

export const structRuleFieldMappingTypeOptions = [
  { value: StructRuleFieldMappingType.None, label: '无' },
  { value: StructRuleFieldMappingType.Enum, label: '枚举' },
  { value: StructRuleFieldMappingType.Encode, label: '码表' },
];

// 任务类型
export enum TaskType {
  // 一次性任务
  OneTime = 'one-time',
  // 循环任务
  Circular = 'circular',
}

export const taskTypeMap: Record<TaskType, string> = {
  [TaskType.OneTime]: '一次性任务',
  [TaskType.Circular]: '循环任务',
};

export const taskTypeOptions = Object.entries(taskTypeMap).map(([k, v]) => ({
  value: k,
  label: v,
}));

// 一次性任务类型
export enum OneTimeTaskType {
  // 定时任务
  Schedule = 'schedule',
  // 立即执行
  Immediate = 'immediate',
}

export const oneTimeTaskTypeMap: Record<OneTimeTaskType, string> = {
  [OneTimeTaskType.Schedule]: '定时任务',
  [OneTimeTaskType.Immediate]: '立即执行',
};

export const oneTimeTaskTypeOptions = Object.entries(oneTimeTaskTypeMap).map(
  ([k, v]) => ({
    value: k,
    label: v,
  }),
);

// 任务状态 1: 启用，0: 停用
export enum TaskStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}
