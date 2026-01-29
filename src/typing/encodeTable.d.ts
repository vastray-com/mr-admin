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

  // 删除码表的参数
  type DeleteParams = {
    uid: string;
  };

  // 码表列表项
  type Item = {
    uid: string;
    name: string;
    comment?: string;
    deleted_at?: string;
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
