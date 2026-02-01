import { App, Empty, Table } from 'antd';
import { type FC, useCallback, useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { WarehousePatientDetailModal } from '@/pages/DatasetManagement/components/WarehousePatientDetailModal';
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

  // 明细数据
  const [openDetail, setOpenDetail] = useState(false);
  const [getDetailLoading, setGetDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Warehouse.PatientDetail | null>(null);
  const onCloseDetail = useCallback(() => {
    setOpenDetail(false);
  }, []);
  const onClickPatient = useCallback(async (r: Record<string, string>) => {
    console.log('row', r);
    if (!r.visit_no) {
      message.warning('无患者 visit_no，无法查看详情');
      return;
    }

    try {
      setGetDetailLoading(true);
      setOpenDetail(true);

      const detail = await warehouseApi.getPatientDetail({
        visit_no: r.visit_no,
      });

      if (detail.code === 200) {
        // 打开患者详情弹窗
        console.log('获取患者详情成功', detail);
        setDetail(detail.data);
      } else {
        console.error('获取患者详情失败:', detail);
        message.error(`获取患者详情失败: ${detail.message}`);
      }
    } catch (error) {
      const e = error as AxiosError<APIRes<string>>;
      console.error('获取患者详情失败:', e);
      message.error(
        `获取患者详情失败: ${e.response?.data?.message || e.message}`,
      );
    } finally {
      setGetDetailLoading(false);
    }
  }, []);

  if (!filter) {
    return <Empty description="还没有设置过滤器" />;
  }

  if (!isFetched && !loading) {
    fetchData({ filter });
  }

  return (
    <>
      <WarehousePatientDetailModal
        open={openDetail}
        onClose={onCloseDetail}
        detail={detail}
        loading={getDetailLoading}
      />

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
        onRow={(r) => ({
          onClick: () => onClickPatient(r),
        })}
      >
        {data?.columns.map((c) => (
          <Table.Column
            title={c.label}
            dataIndex={c.value}
            key={c.value}
            ellipsis
            className="cursor-pointer"
          />
        ))}
      </Table>
    </>
  );
};
