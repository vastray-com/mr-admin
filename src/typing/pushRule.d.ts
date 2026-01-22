import type { PushDataType, PushTargetDB } from '@/typing/enum';

export declare namespace PushRule {
  type ListParams = {
    name?: string;
    update_end?: string;
    update_start?: string;
  };

  type Item = {
    // UUID
    uid: string;
    // 所属结构化规则 ID
    structured_ruleset_uid: string;
    /// 规则名称
    name: string;
    /// 规则备注
    comment?: string;
    /// 原文映射列名，为空不做映射
    source_map_field: string | null;
    /// 推送目标
    target_db: PushTargetDB;
    /// 目标地址
    target_uri: string;
    // 目标表名
    target_table: string;
    // 删除时间
    deleted_at: string | null;
    /// 创建时间
    created_at: string;
    /// 更新时间
    updated_at: string;
  };
  type List = Item[];

  type Detail = Item & {
    // 数据过滤条件
    filter: Filters;
    /// 规则内容
    content: Content;
  };

  // 获取情的参数
  type DetailParams = {
    // UUID
    uid: string;
  };

  // 内容
  type ContentItem = {
    // 原始字段
    source: string;
    // 目标列名
    target: string;
    // 目标字段类型
    data_type: PushDataType;
    // 截取长度
    max_length: number | null;
    // 枚举映射内容
    mapping_content: string | null;
  };
  type Content = ContentItem[];

  // 数据过滤条件
  type Filter = {
    // 原始字段
    source: string;
    // 过滤值
    value: string;
    // 过滤操作符，如 =, !=, >, <, LIKE 等
    operator: string;
  };
  type Filters = Filter[];

  // 操作参数
  type ActionParams = {
    // UUID
    uid: string;
    action: 'delete'; // | 'enable' | 'disable';
  };
}
