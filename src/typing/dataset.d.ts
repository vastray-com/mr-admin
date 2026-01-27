import type {
  DatasetFilterLogic,
  DatasetFilterOperator,
  DatasetFilterTable,
  DatasetType,
} from '@/typing/enum';

export declare namespace Dataset {
  /// 过滤器对象数据库结构
  type FilterColOperateItem = Record<
    DatasetFilterOperator,
    string | number | boolean
  >;
  type FilterCol = Record<string, [FilterColOperateItem]>;
  type FilterTable = Record<DatasetFilterTable, FilterCol[]>;
  type Filter = Partial<Record<DatasetFilterLogic, FilterTable[]>>[];

  // 前端录入时 filter 结构
  type FilterFEInputItem = {
    logic: DatasetFilterLogic;
    group: {
      table: DatasetFilterTable;
      conditions: {
        column: string;
        operator: DatasetFilterOperator;
        value: string | number | boolean;
      }[];
    }[];
  };
  type FilterFEInput = FilterFEInputItem[];
  type InputCreateParams = {
    // 数据集名称
    name_cn: string;
    // 数据集英文标识
    name_en: string;
    // 数据集类型
    dataset_type: DatasetType;
    // 过滤器
    filter: FilterFEInput;
  };

  // 获取列表的参数
  type ListParams = PaginationParams;
  // 获取情的参数
  type DetailParams = { uid: string };
  // 创建参数
  type CreateParams = {
    // 数据集名称
    name_cn: string;
    // 数据集英文标识
    name_en: string;
    // 数据集类型
    dataset_type: DatasetType;
    // 过滤器
    filter: Filter;
  };
  // 更新参数
  type UpdateParams = { uid: string } & CreateParams;
  // 操作参数
  type ActionParams = { uid: string; action: 'delete' };

  // 数据集项
  type Item = {
    // 警告消息
    warning_msg: string;
    // 创建者
    creator: string;
    // 删除时间
    deleted_at: string;
    // 创建时间
    created_at: string;
    // 更新时间
    updated_at: string;
  } & UpdateParams;

  type List = Item[];
}
