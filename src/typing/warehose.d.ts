import type {
  DatasetSourceColumnType,
  DatasetSourceType,
} from '@/typing/enum/dataset';

export declare namespace Warehouse {
  /// [
  ///   {
  ///       "label":"入院记录",
  ///       "value":"#inhospital_record",
  ///       "type": "inpatient"
  ///       "columns":[
  ///           {
  ///               "lable":"住院号",
  ///               "value":"no",
  ///               "data_type":"string"
  ///           },
  ///           {
  ///               "lable":"入院日期",
  ///               "value":"in_date_time",
  ///               "data_type":"date"
  ///           },
  ///           {
  ///               "lable":"年龄",
  ///               "value":"age",
  ///               "data_type":"int"
  ///           },
  ///           {
  ///               "lable":"体温",
  ///               "value":"temp",
  ///               "data_type":"float"
  ///           }
  ///       ]
  ///   }
  /// ]

  type SourceColumn = {
    // 字段展示名称
    label: string;
    // 字段标识
    value: string;
    data_type: DatasetSourceColumnType;
  };
  type SourceColumns = SourceColumn[];

  type SourceSchema = {
    // 表展示名称
    label: string;
    // 表标识
    value: string;
    // 数据源类型
    type: DatasetSourceType;
    // 表字段信息
    columns: SourceColumns;
  };
  type SourceSchemas = SourceSchema[];

  type GetSourceDataParams = {
    filter: Dataset.Filter;
  };
  type SourceData = {
    data: Record<string, string>[];
    columns: SourceColumns;
    total: number;
  };
}
