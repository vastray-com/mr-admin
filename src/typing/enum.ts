// 模版类型
export enum MedicalTemplateType {
  Inpatient = '住院病历',
  Outpatient = '门诊病历',
}
export const medicalTemplateTypeOptions = [
  { value: MedicalTemplateType.Inpatient, label: '住院病历' },
  { value: MedicalTemplateType.Outpatient, label: '门诊病历' },
];

// 病历模版状态
export enum MedicalTemplateStatus {
  Enabled = 0, // 启用中
  Disabled = 1, // 已停用
}

// 值描述类型
export enum MedicalTemplateFieldDescType {
  DimTable = 'dim_table',
  Enum = 'enum',
  Plain = 'plain',
}
export const medicalTemplateFieldDescTypeOptions = [
  { value: MedicalTemplateFieldDescType.DimTable, label: '码表' },
  { value: MedicalTemplateFieldDescType.Enum, label: '枚举型' },
  { value: MedicalTemplateFieldDescType.Plain, label: '纯文本' },
];

// 字段类型
export enum MedicalTemplateFieldType {
  C = 'C',
  Cl = 'CL',
  D = 'D',
  Dt = 'DT',
  N = 'N',
  Vc = 'VC',
}
export const medicalTemplateFieldTypeOptions = [
  { value: MedicalTemplateFieldType.C, label: '字符型' },
  { value: MedicalTemplateFieldType.Cl, label: '字符长型' },
  { value: MedicalTemplateFieldType.D, label: '日期型' },
  { value: MedicalTemplateFieldType.Dt, label: '日期时间型' },
  { value: MedicalTemplateFieldType.N, label: '数值型' },
  { value: MedicalTemplateFieldType.Vc, label: '变长字符型' },
];
