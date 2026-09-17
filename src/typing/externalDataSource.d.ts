export declare namespace ExternalDataSource {
  type SourceType = 'mysql' | 'sqlserver' | 'oracle' | 'pg';

  type Item = {
    uid: string;
    name: string;
    source_type: SourceType | string;
    host: string;
    port: number;
    database_name?: string;
    schema_name?: string;
    username: string;
    enabled: boolean;
    password_set: boolean;
    last_test_at?: string;
    last_test_status?: string;
    last_test_message?: string;
    created_at?: string;
    updated_at?: string;
  };

  type ListParams = {
    include_disabled?: boolean;
  };

  type CreateParams = {
    name: string;
    source_type: SourceType;
    host: string;
    port: number;
    database_name?: string;
    schema_name?: string;
    username: string;
    password: string;
    enabled?: boolean;
    options_json?: string;
  };

  type UpdateParams = {
    uid: string;
    name?: string;
    source_type?: SourceType;
    host?: string;
    port?: number;
    database_name?: string;
    schema_name?: string;
    username?: string;
    password?: string;
    enabled?: boolean;
    options_json?: string;
  };
}
