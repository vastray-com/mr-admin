import type {
  StructRuleFieldDescType,
  StructRuleFieldType,
  StructRuleStatus,
  StructRuleType,
} from './enum';

export declare namespace StructRule {
  type GetListParams = {
    name?: string;
    update_end?: string;
    update_start?: string;
  };
  type ListItem = {
    // 备注
    comment: string;
    // 病历ID
    id: string;
    // Node ID
    mr_node_id: string;
    // 模版类型
    mr_type: StructRuleType;
    // 中文名称
    name_cn: string;
    // 英文名称
    name_en: string;
    // 排序
    sort_index: number;
    // 状态
    status: StructRuleStatus;
    // 创建时间
    update_time: string;
  };
  type List = ListItem[];

  type Field = {
    // 指标定义
    data_define: string;
    // 指标名称
    data_name: string;
    // 码表 ID，值描述类型为码表时不可为空，指定码表 ID
    dim_table_id?: number;
    // 值描述，值描述类型为纯文本或枚举时不可为空
    field_desc?: string;
    // 值描述类型
    field_desc_type: StructRuleFieldDescType;
    // 字段长度
    field_len: string;
    // 字段名
    field_name: string;
    // 字段类型
    field_type: StructRuleFieldType;
  };
  type Fields = Field[];

  type Detail = ListItem & { fields: Fields };

  type SaveDetail = Omit<Detail, 'id' | 'mr_node_id' | 'update_time'>;
}
