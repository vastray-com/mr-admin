// 模版类型
export enum StructRuleType {
  Inpatient = '住院病历',
  Outpatient = '门诊病历',
}
export const structRuleTypeOptions = [
  { value: StructRuleType.Inpatient, label: '住院病历' },
  { value: StructRuleType.Outpatient, label: '门诊病历' },
];

// 病历模版状态
export enum StructRuleStatus {
  Enabled = 0, // 启用中
  Disabled = 1, // 已停用
}

// 值描述类型
export enum StructRuleFieldDescType {
  DimTable = 'dim_table',
  Enum = 'enum',
  Plain = 'plain',
}
export const structRuleFieldDescTypeOptions = [
  { value: StructRuleFieldDescType.DimTable, label: '码表' },
  { value: StructRuleFieldDescType.Enum, label: '枚举型' },
  { value: StructRuleFieldDescType.Plain, label: '纯文本' },
];

// 字段类型
export enum StructRuleFieldType {
  C = 'C',
  Cl = 'CL',
  D = 'D',
  Dt = 'DT',
  N = 'N',
  Vc = 'VC',
}
export const structRuleFieldTypeOptions = [
  { value: StructRuleFieldType.C, label: '字符型' },
  { value: StructRuleFieldType.Cl, label: '字符长型' },
  { value: StructRuleFieldType.D, label: '日期型' },
  { value: StructRuleFieldType.Dt, label: '日期时间型' },
  { value: StructRuleFieldType.N, label: '数值型' },
  { value: StructRuleFieldType.Vc, label: '变长字符型' },
];
