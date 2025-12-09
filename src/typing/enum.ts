// 病历模版状态 1: 启用，0: 停用
export enum StructRuleStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}

// 模版字段来源类型
export enum StructRuleFieldParsingType {
  // LLM 大模型生成
  LLM = 1,
  // 原始数据字段引用
  QuoteOriginal,
  // 静态值
  Static,
}

export const structRuleFieldParsingTypeOptions = [
  { value: StructRuleFieldParsingType.LLM, label: '大模型生成' },
  { value: StructRuleFieldParsingType.QuoteOriginal, label: '原始数据引用' },
  { value: StructRuleFieldParsingType.Static, label: '静态值' },
];

// 字段值类型
export enum StructRuleFieldValueType {
  // 文本
  Text = 'text',
  // 日期
  Date = 'date',
  // 数字
  Number = 'number',
  // 布尔
  Boolean = 'boolean',
}

export const structRuleFieldValueTypeOptions = [
  { value: StructRuleFieldValueType.Text, label: '文本' },
  { value: StructRuleFieldValueType.Date, label: '日期' },
  { value: StructRuleFieldValueType.Number, label: '数字' },
  { value: StructRuleFieldValueType.Boolean, label: '布尔' },
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

// 推送目标类型
export enum PushTargetDB {
  SQLServer = 'sql-server',
  MySQL = 'mysql',
}

export const pushTargetDBOptions = [
  { value: PushTargetDB.SQLServer, label: 'Microsoft SQL Server' },
  { value: PushTargetDB.MySQL, label: 'MySQL' },
];

// 推送字段数据类型
export enum PushDataType {
  String = 'string',
  Int = 'int',
  Float = 'float',
  Bool = 'bool',
}

export const pushDataTypeOptions = [
  { value: PushDataType.String, label: '字符串' },
  { value: PushDataType.Int, label: '整数' },
  { value: PushDataType.Float, label: '浮点数' },
  { value: PushDataType.Bool, label: '布尔值' },
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

// 任务推送状态
export enum TaskPushStatus {
  // 0: 待运行
  Pending = 0,
  // 1: 运行中
  Running = 1,
  // 2: 完成
  Completed = 2,
  // 3: 失败
  Failed = 3,
}
