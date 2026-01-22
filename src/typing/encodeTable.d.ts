declare namespace EncodeTable {
  // 获取码表列表的参数
  type ListParams = {
    name?: string;
    update_end?: string;
    update_start?: string;
  };

  // 获取码表详情的参数
  type DetailParams = {
    uid: string;
  };

  // 操作码表的参数
  type ActionParams = {
    uid: string;
    // 0: 默认 1: 删除
    is_deleted?: 0 | 1;
    // 0: 停用, 1: 启用
    status?: Item['status'];
  };

  // 码表列表项
  type Item = {
    uid: string;
    name: string;
    comment?: string | null;
    deleted_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  type List = Item[];

  // 码表行
  type Row = {
    code: string;
    desc: string;
  };
  type Rows = Row[];

  // 码表详情
  type Detail = Item & {
    content: Rows;
  };

  // 前端编辑表单码表详情
  type FormDetail = Item & {
    content: string;
  };
}
