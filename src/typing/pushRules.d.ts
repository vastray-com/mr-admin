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
    structured_rule_uid: string;
    /// 规则名称
    name_cn: string;
    /// 规则英文名
    name_en: string;
    /// 规则备注
    comment?: string;
    /// 推送目标
    target_db: PushTargetDB;
    /// 目标地址
    target_uri: string;
    /// 创建时间
    create_time: string;
    /// 更新时间
    update_time: string;
  };
  type List = Item[];

  type Detail = Item & {
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
  };
  type Content = ContentItem[];

  // 操作参数
  type ActionParams = {
    // UUID
    uid: string;
    action: 'delete'; // | 'enable' | 'disable';
  };
}
