import { App, Spin } from 'antd';
import { type FC, useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import type { AxiosError } from 'axios';
import type { Dataset } from '@/typing/dataset';
import type { Warehouse } from '@/typing/warehose';

type Props = {
  filter?: Dataset.Filter | null;
  showMessage?: boolean;
};

export const WarehouseDataTable: FC<Props> = ({
  filter,
  showMessage = false,
}) => {
  const { message } = App.useApp();
  const { warehouseApi } = useApi();

  const [isFetched, setIsFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Warehouse.SourceData | null>(null);

  const fetchData = async (params: Warehouse.GetSourceDataParams) => {
    setLoading(true);
    try {
      const res = await warehouseApi.getSourceData(params);
      if (res.code === 200) {
        console.log('拉取明细数据成功:', res.data);
        showMessage && message.success('明细数据加载成功');
        setData(res.data);
      } else {
        showMessage && message.error(res.message || '明细数据加载失败');
      }
    } catch (err) {
      const e = err as AxiosError<APIRes<any>>;
      showMessage &&
        message.error(e.response?.data.message ?? '明细数据加载失败');
    } finally {
      setLoading(false);
      setIsFetched(true);
    }
  };

  useEffect(() => {
    setIsFetched(false);
  }, [filter]);

  if (!filter) {
    return <div className="w-full h-[200px]">还没有设置过滤器</div>;
  }

  if (loading) {
    return <Spin spinning={loading} tip="数据加载中..." />;
  }

  if (!isFetched) {
    fetchData({ filter });
  }

  if (!data) {
    return <div className="w-full h-[200px]">当前过滤器未查询到数据</div>;
  }

  return data.data?.map((d, i) => (
    <p key={i} className="whitespace-pre-line">
      {JSON.stringify(d, null, 2)}
    </p>
  ));
};
