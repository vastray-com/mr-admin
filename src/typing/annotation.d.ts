export declare namespace Annotation {
  type Project = {
    uid: string;
    name: string;
    description?: string;
    creator: string;
    creator_name?: string;
    libraries: Library[];
    created_at?: string;
    updated_at?: string;
  };

  type ColumnSchema = {
    name: string;
    label: string;
    data_type: string;
    data_length?: number;
  };

  type Library = {
    uid: string;
    name: string;
    description?: string;
    project_uid: string;
    source_dataset_uid: string;
    doris_table_name: string;
    row_count: number;
    table_schema: ColumnSchema[];
    created_at: string;
    updated_at: string;
  };

  type ListParams = PaginationParams & {
    name?: string;
  };

  type CreateProjectParams = {
    name: string;
    description?: string;
  };

  type UpdateProjectParams = {
    uid: string;
    name?: string;
    description?: string;
  };

  type ImportLibraryParams = {
    project_uid: string;
    dataset_uid: string;
    name: string;
    description?: string;
  };

  type UpdateLibraryParams = {
    project_uid: string;
    library_uid: string;
    name?: string;
    description?: string;
  };

  type DeleteLibraryParams = {
    project_uid: string;
    library_uid: string;
  };

  type ImportableDatasetOption = {
    uid: string;
    name_cn: string;
  };

  type LibraryDetail = {
    project_uid: string;
    project_name: string;
    library: Library;
  };

  type LibraryDataPageParams = {
    project_uid: string;
    library_uid: string;
    page_num: number;
    page_size?: number;
    keyword?: string;
  };

  type LibraryDataPage = {
    total: number;
    page_num: number;
    page_size: number;
    data: Record<string, any>[];
  };

  type SaveLibraryRowParams = {
    project_uid: string;
    library_uid: string;
    row_id: string;
    values: Record<string, any>;
  };
}
