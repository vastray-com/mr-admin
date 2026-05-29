declare namespace Audit {
  type Log = {
    uid: string;
    request_ip?: string;
    method: string;
    path: string;
    query?: string;
    module: string;
    action: string;
    status_code: number;
    duration_ms: number;
    request_headers?: Record<string, unknown>;
    request_body?: unknown;
    response_body?: unknown;
    operator_uid?: string;
    operator_username?: string;
    operator_role?: string;
    created_at?: string;
  };

  type ListParams = PaginationParams & {
    module?: string;
    action?: string;
    method?: string;
    status_code?: number;
    operator_uid?: string;
    request_ip?: string;
    path_keyword?: string;
    started_at?: string;
    ended_at?: string;
  };

  type DetailParams = {
    uid: string;
  };

  type OptionItem = {
    label: string;
    value: string;
  };

  type FilterOptions = {
    modules: OptionItem[];
    actions: OptionItem[];
    methods: OptionItem[];
    status_codes: OptionItem[];
    operators: OptionItem[];
  };
}
