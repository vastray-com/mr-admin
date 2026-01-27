import { enumMapToOptions } from '@/utils/helper';

// 字段来源类型
export enum StructuredFieldParsingType {
  // LLM 大模型生成
  LLM = 'llm',
  // 原始数据字段引用
  Original = 'original',
  // 静态值
  Static = 'static',
  // 无操作
  None = 'none',
}
const PARSING_TYPE_MAP: Record<StructuredFieldParsingType, string> = {
  [StructuredFieldParsingType.LLM]: '大模型生成',
  [StructuredFieldParsingType.Original]: '原始数据引用',
  [StructuredFieldParsingType.Static]: '静态值',
  [StructuredFieldParsingType.None]: '无',
};

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
const VALUE_TYPE_MAP: Record<StructuredFieldValueType, string> = {
  [StructuredFieldValueType.Text]: '文本',
  [StructuredFieldValueType.Date]: '日期',
  [StructuredFieldValueType.Number]: '数字',
  [StructuredFieldValueType.Bool]: '布尔',
};

// 字段映射类型
export enum StructuredFieldMappingType {
  // 无
  None = 'none',
  // 枚举
  EnumMapping = 'enum_mapping',
  // 码表
  EncodeTable = 'encode_table',
}
const MAPPING_TYPE_MAP: Record<StructuredFieldMappingType, string> = {
  [StructuredFieldMappingType.None]: '无',
  [StructuredFieldMappingType.EnumMapping]: '枚举',
  [StructuredFieldMappingType.EncodeTable]: '码表',
};

export default {
  PARSING_TYPE_MAP,
  PARSING_TYPE_OPT: enumMapToOptions(PARSING_TYPE_MAP),
  VALUE_TYPE_MAP,
  VALUE_TYPE_OPT: enumMapToOptions(VALUE_TYPE_MAP),
  MAPPING_TYPE_MAP,
  MAPPING_TYPE_OPT: enumMapToOptions(MAPPING_TYPE_MAP),
};
