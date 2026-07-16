import type { DatasetType } from '@/typing/enum/dataset';

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
    source_dataset_type?: DatasetType;
    source_unique_key?: string;
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

  type RefreshLibraryParams = {
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
    form_fields: FormField[];
  };

  type FieldOption = {
    value: string;
    label: string;
  };

  type FormChildField = {
    key: string;
    label: string;
    value_type: 'text' | 'date' | 'number' | 'bool';
    is_array: boolean;
    mapping_type?: 'enum_mapping' | 'encode_table';
    mapping_content?: string;
    mapping_options: FieldOption[];
  };

  type FormField = {
    key: string;
    label: string;
    column_name: string;
    value_type: 'text' | 'date' | 'number' | 'bool' | 'object';
    is_array: boolean;
    mapping_type?: 'enum_mapping' | 'encode_table';
    mapping_content?: string;
    mapping_options: FieldOption[];
    children: FormChildField[];
  };

  type LibraryDataPageParams = {
    project_uid: string;
    library_uid: string;
    page_num: number;
    page_size?: number;
    keyword?: string;
    annotation_status?: 'pending' | 'completed';
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

  type CompleteLibraryRowParams = {
    project_uid: string;
    library_uid: string;
    row_id: string;
  };
}
