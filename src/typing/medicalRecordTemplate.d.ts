declare namespace MedicalRecordTemplate {
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
    mr_type: '住院病历' | '门诊病历';
    // 中文名称
    name_cn: string;
    // 英文名称
    name_en: string;
    // 排序
    sort_index: number;
    // 状态 0-启用 1-禁用
    status: 0 | 1;
    // 创建时间
    update_time: string;
  };
  type List = ListItem[];
}
