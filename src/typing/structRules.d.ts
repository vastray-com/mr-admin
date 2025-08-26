import {
  type StructRuleFieldValueType,
  type StructRuleStatus,
  StructRuleFieldSourceType,
  StructRuleFieldMappingType,
} from './enum';

export declare namespace StructRule {
  type GetListParams = PaginationParams & {
    name?: string;
    update_end?: string;
    update_start?: string;
  };
  type Item = {
    /// 自增ID
    id: number;
    /// 规则名称
    name_cn: string;
    /// 规则英文名
    name_en: string;
    /// 规则备注
    comment?: string;
    /// 状态（1: 启用，0: 停用）
    status: StructRuleStatus;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
  };
  type List = Item[];

  // 获取情的参数
  type DetailParams = {
    id: number;
  };
  // 规则详情
  type Detail = Item & {
    /// 规则分类
    category: Categories;
    /// 规则字段树
    fields: Fields;
    /// 规则代码片段
    code_snippets: CodeSnippets;
  };

  type Category = {
    /// 自增ID
    id: number;
    /// 所属规则 ID
    rule_id: number;
    /// 分类名称
    name_cn: string;
    /// 分类字段名（英文名）
    name_en: string;
    /// 分类提取规则
    content: string;
    /// 分类排序（数字越小越靠前）
    sort: number;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
  };
  type Categories = Category[];

  type CodeSnippet = {
    /// 自增ID
    id: number;
    /// 所属规则 ID
    rule_id: number;
    /// 代码片段内容
    content: string;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
  };
  type CodeSnippets = CodeSnippet[];

  type Field = {
    /// 自增ID
    id: number;
    /// 所属规则 ID
    rule_id: number;
    /// 父字段
    parent_name?: string;
    /// 所属分类字段名
    category_name?: string;
    /// 提取字段名称
    name_cn: string;
    /// 字段键名称
    name_en: string;
    /// 字段定义
    source_type: StructRuleFieldSourceType;
    /// 解析规则 来源为 LLM 时为 prompt，为原始数据引用时为原始数据取数 path， 为结构化数据引用时为 name_en， 为静态值时为值内容
    parsing_rule: string;
    /// 字段值类型
    value_type: StructRuleFieldValueType;
    /// 映射类型 NULL 为不映射
    mapping_type: StructRuleFieldMappingType | null;
    //  映射内容 映射类型为空时忽略，为码表时为码表 ID，为枚举时为枚举列表内容
    mapping_content: string;
    /// 字段是否需要最终入库 1: 需要 0: 不需要
    need_store: 0 | 1;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
  };
  type Fields = Field[];

  type ActionParams = {
    id: number;
    action: 'enable' | 'disable' | 'delete';
  };
}
