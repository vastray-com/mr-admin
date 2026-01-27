// 病历模版状态 1: 启用，0: 停用
export enum StructRuleStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}

// 模版字段来源类型
export enum StructuredFieldParsingType {
  // LLM 大模型生成
  LLM = 'llm',
  // 原始数据字段引用
  QuoteOriginal = 'quote_original',
  // 静态值
  Static = 'static',
  // 无操作
  None = 'none',
}

export const structRuleFieldParsingTypeOptions = [
  { value: StructuredFieldParsingType.LLM, label: '大模型生成' },
  { value: StructuredFieldParsingType.QuoteOriginal, label: '原始数据引用' },
  { value: StructuredFieldParsingType.Static, label: '静态值' },
  { value: StructuredFieldParsingType.None, label: '无' },
];

// 字段值类型
export enum StructuredFieldValueType {
  // 文本
  Text = 'text',
  // 日期
  Date = 'date',
  // 数字
  Number = 'number',
  // 布尔
  Bool = 'bool',
}

export const structRuleFieldValueTypeOptions = [
  { value: StructuredFieldValueType.Text, label: '文本' },
  { value: StructuredFieldValueType.Date, label: '日期' },
  { value: StructuredFieldValueType.Number, label: '数字' },
  { value: StructuredFieldValueType.Bool, label: '布尔' },
];

// 字段映射类型
export enum StructuredFieldMappingType {
  // 无
  None = 'none',
  // 枚举
  EnumMapping = 'enum_mapping',
  // 码表
  EncodeTable = 'encode_table',
}

export const structRuleFieldMappingTypeOptions = [
  { value: StructuredFieldMappingType.None, label: '无' },
  { value: StructuredFieldMappingType.EnumMapping, label: '枚举' },
  { value: StructuredFieldMappingType.EncodeTable, label: '码表' },
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

// 任务状态
export enum TaskStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}

// 任务实例状态 pending: 待运行 running: 运行中 completed: 完成 failed: 失败 stopped: 停止 (手动停止) paused: 暂停
export enum TaskInstanceStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Stopped = 'stopped',
  Paused = 'paused',
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

// 用户角色
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

// 数据集类型
export enum DatasetType {
  Review = 'review',
  Subscribe = 'subscribe',
}

export const datasetTypeMap: Record<DatasetType, string> = {
  [DatasetType.Review]: '回顾数据集',
  [DatasetType.Subscribe]: '订阅数据集',
};
export const datasetTypeOptions = Object.entries(datasetTypeMap).map(
  ([k, v]) => ({
    value: k,
    label: v,
  }),
);

// 数据集 filter 逻辑
export enum DatasetFilterLogic {
  And = '$AND',
  Or = '$OR',
}
export const datasetFilterLogicMap: Record<DatasetFilterLogic, string> = {
  [DatasetFilterLogic.And]: '且（AND）',
  [DatasetFilterLogic.Or]: '或（OR）',
};
export const datasetFilterLogicOptions = Object.entries(
  datasetFilterLogicMap,
).map(([k, v]) => ({
  value: k,
  label: v,
}));

// 数据集 filter 表名
export enum DatasetFilterTable {
  /// 门/急诊病历
  EmergencyRecord = '#emergency_record',
  /// 入院记录
  AdmissionRecord = '#admission_record',
  /// 首次病程记录
  FirstCourseRecord = '#first_course_record',
  /// 出院记录
  DischargeRecord = '#discharge_record',
  /// 手术前小结
  PreoperativeSummary = '#preoperative_summary',
  /// 手术记录
  SurgeryRecord = '#surgery_record',
  /// 实验室检查
  LaboratoryExamination = '#laboratory_examination',
  /// CT 报告
  CTReport = '#ct_report',
  /// MRI 报告
  MRIReport = '#mri_report',
  /// 超声报告
  UltrasoundReport = '#ultrasound_report',
  /// 病理报告
  PathologyReport = '#pathology_report',
  /// X光报告
  XRayReport = '#xray_report',
  /// 心电图报告
  ECGReport = '#ecg_report',
}
export const datasetFilterTableMap: Record<DatasetFilterTable, string> = {
  [DatasetFilterTable.EmergencyRecord]: '门/急诊病历',
  [DatasetFilterTable.AdmissionRecord]: '入院记录',
  [DatasetFilterTable.FirstCourseRecord]: '首次病程记录',
  [DatasetFilterTable.DischargeRecord]: '出院记录',
  [DatasetFilterTable.PreoperativeSummary]: '手术前小结',
  [DatasetFilterTable.SurgeryRecord]: '手术记录',
  [DatasetFilterTable.LaboratoryExamination]: '实验室检查',
  [DatasetFilterTable.CTReport]: 'CT 报告',
  [DatasetFilterTable.MRIReport]: 'MRI 报告',
  [DatasetFilterTable.UltrasoundReport]: '超声报告',
  [DatasetFilterTable.PathologyReport]: '病理报告',
  [DatasetFilterTable.XRayReport]: 'X光报告',
  [DatasetFilterTable.ECGReport]: '心电图报告',
};
export const datasetFilterTableOptions = Object.entries(
  datasetFilterTableMap,
).map(([k, v]) => ({
  value: k,
  label: v,
}));

// 数据集 filter 操作符
export enum DatasetFilterOperator {
  Equal = '$eq',
  NotEqual = '$ne',
  GreaterThan = '$gt',
  GreaterThanOrEqual = '$gte',
  LessThan = '$lt',
  LessThanOrEqual = '$lte',
  Contains = '$contains',
  NotContains = '$not_contains',
}
export const datasetFilterOperatorMap: Record<DatasetFilterOperator, string> = {
  [DatasetFilterOperator.Equal]: '等于',
  [DatasetFilterOperator.NotEqual]: '不等于',
  [DatasetFilterOperator.GreaterThan]: '大于',
  [DatasetFilterOperator.GreaterThanOrEqual]: '大于等于',
  [DatasetFilterOperator.LessThan]: '小于',
  [DatasetFilterOperator.LessThanOrEqual]: '小于等于',
  [DatasetFilterOperator.Contains]: '包含',
  [DatasetFilterOperator.NotContains]: '不包含',
};
export const datasetFilterOperatorOptions = Object.entries(
  datasetFilterOperatorMap,
).map(([k, v]) => ({
  value: k,
  label: v,
}));
