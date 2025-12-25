import { Pagination } from 'antd';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type Options<T> = {
  fetchData: (params: PaginationParams) => Promise<APIRes<PaginationData<T>>>;
  setData: (data: T[]) => void;
};

type Hook = <T>(opt: Options<T>) => {
  PaginationComponent: () => ReactNode;
  refresh: () => void;
};

export const usePaginationData: Hook = (opt) => {
  const isInitial = useRef(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState<PaginationParams>({
    page_num: 1,
    page_size: 10,
  });

  const onPaginationChange = useCallback(
    async (params: PaginationParams) => {
      try {
        const result = await opt.fetchData(params);
        if (result.code === 200) {
          opt.setData(result.data.data);
          setTotal(result.data.total);
          setPagination(params);
        } else {
          console.error('获取分页数据失败：', result.message);
        }
      } catch (e) {
        console.error('获取分页数据失败：', e);
      }
    },
    [opt.fetchData, opt.setData],
  );

  useEffect(() => {
    if (!isInitial.current) {
      isInitial.current = true;
      onPaginationChange(pagination);
    }
  }, [onPaginationChange, pagination]);

  return {
    PaginationComponent: () => (
      <Pagination
        showTotal={(total) => `共 ${total} 条`}
        showSizeChanger
        current={pagination.page_num}
        pageSize={pagination.page_size}
        onChange={(page_num, page_size) =>
          onPaginationChange({ page_num, page_size })
        }
        total={total}
      />
    ),
    refresh: useCallback(
      () => onPaginationChange(pagination),
      [onPaginationChange, pagination],
    ),
  };
};
