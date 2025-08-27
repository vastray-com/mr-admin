declare namespace Encode {
  // 获取码表列表的参数
  type ListParams = {
    name?: string;
    update_end?: string;
    update_start?: string;
  };

  // 获取码表详情的参数
  type DetailParams = {
    id: number;
  };

  // 操作码表的参数
  type ActionParams = {
    id: number;
    // 0: 默认 1: 删除
    is_deleted?: 0 | 1;
    // 0: 停用, 1: 启用
    status?: Item['status'];
  };

  // 码表列表项
  type Item = {
    id: number;
    name_cn: string;
    name_en?: string | null;
    // 0: 内置, 1: 自定义
    encode_type: 0 | 1;
    comment?: string | null;
    // 0: 停用, 1: 启用
    status?: 0 | 1;
    create_time?: string;
    update_time?: string;
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
    value: Row[];
  };

  // 码表详情
  type FormDetail = Item & {
    value: string;
  };
}
