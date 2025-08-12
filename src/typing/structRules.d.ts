import type { StructRuleFieldValueType, StructRuleStatus } from './enum';

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
    /// 唯一 ID UUID v7
    // uid: string;
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
    field_define: string;
    /// 字段类型（VC/C）
    field_type: string;
    /// 字段长度
    field_len: string;
    /// 字段值类型（1: 文本 2: 枚举 3: 码表 4: 多项单字段文本 5: 多项单字段码表 6: 多项多字段 7: 多项多字段码表 ）
    value_type: StructRuleFieldValueType;
    /// 字段值描述（静态值类型为填入的内容，码表值类型为空，其他值类型为大模型 prompt）
    value_desc?: string;
    /// 值转换的来源字段 name_en，仅 码表 值类型存在
    value_source_name?: string;
    /// 字段是否需要最终入库 1: 需要 0: 不需要
    need_store: 0 | 1;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
    /// 子字段
    // children: FieldTrees;
  };
  type Fields = Field[];

  type ActionParams = {
    id: number;
    action: 'enable' | 'disable' | 'delete';
  };
}
