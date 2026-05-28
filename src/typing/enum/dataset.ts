import { enumMapToOptions } from '@/utils/helper';

// 数据集类型
export enum DatasetType {
  Review = 'review',
  Subscribe = 'subscribe',
}

const TYPE_MAP: Record<DatasetType, string> = {
  [DatasetType.Review]: '回顾数据集',
  [DatasetType.Subscribe]: '订阅数据集',
};

// 数据集数据源类型
export enum DatasetSourceType {
  Outpatient = 'outpatient',
  Inpatient = 'inpatient',
}

const SOURCE_TYPE_MAP: Record<DatasetSourceType, string> = {
  [DatasetSourceType.Outpatient]: '门诊',
  [DatasetSourceType.Inpatient]: '住院',
};

// 数据集数据源 Schema 列值类型
export enum DatasetSourceColumnType {
  String = 'string',
  Date = 'date',
  Int = 'int',
  Float = 'float',
  Bool = 'bool',
}

const SOURCE_COLUMN_TYPE_MAP: Record<DatasetSourceColumnType, string> = {
  [DatasetSourceColumnType.String]: '字符串',
  [DatasetSourceColumnType.Date]: '日期',
  [DatasetSourceColumnType.Int]: '整数',
  [DatasetSourceColumnType.Float]: '浮点数',
  [DatasetSourceColumnType.Bool]: '布尔值',
};

// 数据集 filter 逻辑
export enum DatasetFilterLogic {
  And = '$AND',
  Or = '$OR',
}

const FILTER_LOGIC_MAP: Record<DatasetFilterLogic, string> = {
  [DatasetFilterLogic.And]: '且（AND）',
  [DatasetFilterLogic.Or]: '或（OR）',
};

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

const FILTER_OPERATOR_MAP: Record<DatasetFilterOperator, string> = {
  [DatasetFilterOperator.Equal]: '等于',
  [DatasetFilterOperator.NotEqual]: '不等于',
  [DatasetFilterOperator.GreaterThan]: '大于',
  [DatasetFilterOperator.GreaterThanOrEqual]: '大于等于',
  [DatasetFilterOperator.LessThan]: '小于',
  [DatasetFilterOperator.LessThanOrEqual]: '小于等于',
  [DatasetFilterOperator.Contains]: '包含',
  [DatasetFilterOperator.NotContains]: '不包含',
};

export default {
  TYPE_MAP,
  TYPE_OPT: enumMapToOptions(TYPE_MAP),
  SOURCE_TYPE_MAP,
  SOURCE_TYPE_OPT: enumMapToOptions(SOURCE_TYPE_MAP),
  FILTER_LOGIC_MAP,
  FILTER_LOGIC_OPT: enumMapToOptions(FILTER_LOGIC_MAP),
  FILTER_OPERATOR_MAP,
  FILTER_OPERATOR_OPT: enumMapToOptions(FILTER_OPERATOR_MAP),
  SOURCE_COLUMN_TYPE_MAP,
  SOURCE_COLUMN_TYPE_OPT: enumMapToOptions(SOURCE_COLUMN_TYPE_MAP),
};
