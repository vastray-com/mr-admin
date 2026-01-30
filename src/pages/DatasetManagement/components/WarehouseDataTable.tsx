import { App, Empty, Table } from 'antd';
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

  if (!isFetched && !loading) {
    fetchData({ filter });
  }

  return (
    <Table<Record<string, string>>
      loading={loading}
      scroll={{ x: true }}
      dataSource={data?.data}
      rowKey={(r, i) => (i ? i.toString() : JSON.stringify(r))}
      pagination={{
        hideOnSinglePage: true,
        showTotal: (t) => `共 ${t} 条`,
        showSizeChanger: true,
      }}
      locale={{
        emptyText: (
          <Empty
            style={{ padding: '48px 0' }}
            description="当前过滤器未过滤出数据，可尝试修改条件再试"
          />
        ),
      }}
    >
      {data?.columns.map((c) => (
        <Table.Column
          title={c.label}
          dataIndex={c.value}
          key={c.value}
          ellipsis
        />
      ))}
    </Table>
  );
};
