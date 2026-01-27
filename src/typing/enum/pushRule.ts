import { enumMapToOptions } from '@/utils/helper';

// 推送目标类型
export enum PushTargetDB {
  SqlServer = 'sql_server',
  MySql = 'mysql',
}
const TARGET_DB_MAP: Record<PushTargetDB, string> = {
  [PushTargetDB.SqlServer]: 'Microsoft SQL Server',
  [PushTargetDB.MySql]: 'MySQL',
};

// 推送字段数据类型
export enum PushDataType {
  String = 'string',
  Int = 'int',
  Float = 'float',
  Bool = 'bool',
}
const DATA_TYPE_MAP: Record<PushDataType, string> = {
  [PushDataType.String]: '字符串',
  [PushDataType.Int]: '整数',
  [PushDataType.Float]: '浮点数',
  [PushDataType.Bool]: '布尔值',
};

export default {
  TARGET_DB_MAP,
  TARGET_DB_OPT: enumMapToOptions(TARGET_DB_MAP),
  DATA_TYPE_MAP,
  DATA_TYPE_OPT: enumMapToOptions(DATA_TYPE_MAP),
};
