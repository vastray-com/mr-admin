type APIRes<T> = {
  code: number;
  msg: string;
  data: T;
};

type PaginationParams = {
  page_num: number;
  page_size: number;
};

type PaginationData<T> = {
  total: number;
  page_num: number;
  page_size: number;
  data: T[];
};
