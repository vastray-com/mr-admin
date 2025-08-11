// 病历模版状态 1: 启用，0: 停用
export enum StructRuleStatus {
  Disabled = 0, // 已停用
  Enabled = 1, // 启用中
}

// 值描述类型 1: 文本 2: 枚举 3: 码表 4: 多项单字段文本 5: 多项单字段码表 6: 多项多字段 7: 多项多字段码表
export const StructRuleFieldValueTypeOptions = [
  { value: 1, label: '纯文本' },
  { value: 2, label: '枚举型' },
  { value: 3, label: '码表' },
  { value: 4, label: '多项单字段文本' },
  { value: 5, label: '多项单字段码表' },
  { value: 6, label: '多项多字段文本' },
  { value: 7, label: '多项多字段码表' },
];
export type StructRuleFieldValueType =
  (typeof StructRuleFieldValueTypeOptions)[number]['value'];

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

// 任务管理
export const TaskType: Record<Task.Item['task_type'], string> = {
  0: '单次任务',
  1: '循环任务',
};
