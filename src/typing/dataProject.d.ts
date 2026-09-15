export declare namespace DataProject {
  type Item = {
    uid: string;
    name: string;
    comment?: string;
    doris_database: string;
    creator?: string;
    creator_name?: string;
    created_at?: string;
    updated_at?: string;
  };

  type List = Item[];

  type ListParams = PaginationParams & {
    name?: string;
  };

  type CreateParams = {
    name: string;
    // 新建的 Doris 数据库名；不传则根据项目名称自动推导
    doris_database?: string;
    comment?: string;
  };

  type UpdateParams = {
    uid: string;
    name?: string;
    comment?: string;
  };

  type View = {
    uid: string;
    project_uid: string;
    name: string;
    sql: string;
    comment?: string;
    creator?: string;
    creator_name?: string;
    created_at?: string;
    updated_at?: string;
  };

  type ViewList = {
    total: number;
    data: View[];
  };

  type ViewListParams = {
    project_uid: string;
  };

  type CreateViewParams = {
    project_uid: string;
    name: string;
    sql: string;
    comment?: string;
  };

  type UpdateViewParams = {
    uid: string;
    sql: string;
    comment?: string;
  };

  type DeleteViewParams = {
    uid: string;
  };

  type ViewColumn = {
    value: string;
    label: string;
  };

  type ViewDataParams = {
    uid: string;
    page_num: number;
    page_size: number;
  };

  type ViewData = {
    columns: ViewColumn[];
    total: number;
    data: Record<string, any>[];
  };

  // 执行视图 SQL 入参（详情页“执行当前 SQL”检索数据）
  type ViewQueryParams = {
    sql: string;
    limit?: number;
  };

  // 执行视图 SQL 结果
  type ViewQueryResult = {
    columns: ViewColumn[];
    rows: Record<string, any>[];
    count: number;
  };
}
