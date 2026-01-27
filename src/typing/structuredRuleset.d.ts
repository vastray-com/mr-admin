import type {
  StructuredFieldMappingType,
  StructuredFieldParsingType,
  StructuredFieldValueType,
} from '@/typing/enum/structuredRuleset';

export declare namespace StructuredRuleset {
  type ListParams = {
    name?: string;
    update_end?: string;
    update_start?: string;
  };

  type Item = {
    // UUID
    uid: string;
    /// 规则名称
    name_cn: string;
    /// 规则英文名
    name_en: string;
    /// 规则备注
    comment?: string;
    // 创建人 ID
    creator: string;
    // 分享列表
    shared_users: string[];
    /// 规则字段树
    fields: Fields;
    /// 删除时间
    deleted_at?: string;
    /// 创建时间
    created_at?: string;
    /// 更新时间
    updated_at?: string;
  };
  type List = Item[];

  // 获取情的参数
  type DetailParams = {
    // UUID
    uid: string;
  };

  type Field = {
    /// uid
    uid: string;
    /// 提取字段名称
    name_cn: string;
    /// 字段键名称
    name_en: string;
    /// 数据来源，category/field#字段名
    data_source?: string;
    /// 解析方式
    parsing_type: StructuredFieldParsingType;
    /// 解析规则 来源为 LLM 时为 prompt，为原始数据引用时为原始数据取数 path，为静态值时为值内容
    parsing_rule: string;
    /// 字段值类型
    value_type: StructuredFieldValueType;
    // 是否数组
    is_array: boolean;
    /// 映射类型
    mapping_type: StructuredFieldMappingType;
    //  映射内容 映射类型为空时忽略，为码表时为码表 ID，为枚举时为枚举列表内容
    mapping_content: string;
    /// 字段是否需要最终入库 1: 需要 0: 不需要
    need_store: 0 | 1;
  };
  type Fields = Field[];

  type ActionParams = {
    // UUID
    uid: string;
    action: 'delete'; // 'enable' | 'disable' ;
  };

  type PresetField = {
    id: number;
    // 提取字段名称
    name_cn: string;
    // 字段键名称
    name_en: string;
    // 数据来源，大字段/小字段#字段名
    data_source: string;
    // 解析方式
    parsing_type: StructuredFieldParsingType;
    // 解析规则 来源为 LLM 时为 prompt，为原始数据引用时为原始数据取数path， 为结构化数据引用时为 name_en， 为静态值时为值内容
    parsing_rule: string;
    // 字段值类型
    value_type: StructuredFieldValueType;
    // 是否数组
    is_array: boolean;
    // 映射类型
    mapping_type: StructuredFieldMappingType;
    // 映射内容 映射类型为空时忽略，为码表时为码表 ID，为枚举时为枚举列表内容
    mapping_content: string;
  };
  type PresetFields = PresetField[];

  type TestRuleParams = {
    uid: string;
    output_filter: string[];
    content: string;
    api_key: string;
    is_thinking: boolean;
    is_check: boolean;
    // 并行数量
    parallel: number;
  };
}
