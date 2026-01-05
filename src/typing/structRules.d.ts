import type {
  StructRuleFieldMappingType,
  StructRuleFieldParsingType,
  StructRuleFieldValueType,
  StructRuleStatus,
} from './enum';

export declare namespace StructRule {
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
    /// 状态（1: 启用，0: 停用）
    status: StructRuleStatus;
    // 创建人 ID
    creator: string;
    // 分享列表
    shared_users: string[];
    /// 规则分类
    category: Categories;
    /// 规则字段树
    fields: Fields;
    /// 规则代码片段
    code_snippets: CodeSnippets;
    /// 创建时间
    create_time?: string;
    /// 更新时间
    update_time?: string;
  };
  type List = Item[];

  // 获取情的参数
  type DetailParams = {
    // UUID
    uid: string;
  };

  type Category = {
    /// uid
    uid: string;
    /// 分类排序（数字越小越靠前）
    sort?: number;
    /// 分类名称
    name_cn: string;
    /// 分类字段名（英文名）
    name_en: string;
    /// 分类提取规则
    content: string;
  };
  type Categories = Category[];

  type CodeSnippet = {
    /// 代码片段内容
    content: string;
  };
  type CodeSnippets = CodeSnippet[];

  type Field = {
    /// uid
    uid: string;
    /// 提取字段名称
    name_cn: string;
    /// 字段键名称
    name_en: string;
    /// 数据来源，category/field#字段名
    data_source?: string;
    /// 解析方式 1: LLM 大模型生成 2: 原始数据字段引用 3: 静态值
    parsing_type: StructRuleFieldParsingType;
    /// 解析规则 来源为 LLM 时为 prompt，为原始数据引用时为原始数据取数 path，为静态值时为值内容
    parsing_rule: string;
    /// 字段值类型
    value_type: StructRuleFieldValueType;
    // 是否数组
    is_array: boolean;
    /// 映射类型 NULL 为不映射
    mapping_type: StructRuleFieldMappingType | null;
    //  映射内容 映射类型为空时忽略，为码表时为码表 ID，为枚举时为枚举列表内容
    mapping_content: string;
    /// 字段是否需要最终入库 1: 需要 0: 不需要
    need_store: 0 | 1;
  };
  type Fields = Field[];

  type ActionParams = {
    // UUID
    uid: string;
    action: 'enable' | 'disable' | 'delete';
  };

  type PresetField = {
    id: number;
    // 提取字段名称
    name_cn: string;
    // 字段键名称
    name_en: string;
    // 数据来源，大字段/小字段#字段名
    data_source: string;
    // 解析方式 1: LLM 大模型生成 2: 原始数据字段引用 3: 静态值
    parsing_type: number;
    // 解析规则 来源为 LLM 时为 prompt，为原始数据引用时为原始数据取数path， 为结构化数据引用时为 name_en， 为静态值时为值内容
    parsing_rule: string;
    // 字段值类型
    value_type: StructRuleFieldValueType;
    // 是否数组
    is_array: boolean;
    // 映射类型 0: 不映射 1: 枚举 2: 码表
    mapping_type: number;
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
