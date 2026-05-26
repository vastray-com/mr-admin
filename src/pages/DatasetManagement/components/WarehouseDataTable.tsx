import { App, Empty, Input, Table } from 'antd';
import { type FC, useCallback, useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { WarehousePatientDetailModal } from '@/pages/DatasetManagement/components/WarehousePatientDetailModal';
import type { AxiosError } from 'axios';
import type { Dataset } from '@/typing/dataset';
import type { Warehouse } from '@/typing/warehose';

type Props = {
  filter?: Dataset.FilterValue | null;
  showMessage?: boolean;
  datasetUid?: string;
};

export const WarehouseDataTable: FC<Props> = ({
  filter,
  showMessage = false,
  datasetUid,
}) => {
  const { message } = App.useApp();
  const { warehouseApi } = useApi();

  const [isFetched, setIsFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Warehouse.SourceData | null>(null);

  const [searchKey, setSearchKey] = useState('');
  const [showData, setShowData] = useState<Warehouse.SourceData | null>(null);

  const fetchData = async (params: Warehouse.GetSourceDataParams) => {
    setLoading(true);
    try {
      const res = await warehouseApi.getSourceData(params);
      if (res.code === 200) {
        console.log('拉取明细数据成功:', res.data);
        showMessage && message.success('明细数据加载成功');
        setData(res.data);
        setShowData(res.data);
        setSearchKey('');
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

  // 搜索数据
  const onSearch = useCallback(
    (v: string) => {
      const list = data?.data ?? [];
      if (list.length === 0) {
        setShowData(data);
        return;
      }
      const key = v.trim();
      if (!key) return;

      const l = list.filter((r) => {
        const text = Object.values(r).join(' ').trim().replace(/　+/g, ' ');
        return text.includes(key);
      });
      const display: Warehouse.SourceData = {
        columns: data?.columns ?? [],
        total: l.length ?? 0,
        data: l,
      };
      setShowData(display);
    },
    [data],
  );

  // 明细数据
  const [openDetail, setOpenDetail] = useState(false);
  const [getDetailLoading, setGetDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Warehouse.PatientDetail | null>(null);
  const [parsedDetail, setParsedData] =
    useState<Warehouse.PatientDetail | null>(null);
  const onCloseDetail = useCallback(() => {
    setOpenDetail(false);
  }, []);
  const onClickPatient = useCallback(
    async (r: Record<string, string>) => {
      console.log('row', r);
      if (!r.visit_no) {
        message.warning('无患者 visit_no，无法查看详情');
        return;
      }

      setGetDetailLoading(true);
      setOpenDetail(true);

      Promise.allSettled([
        warehouseApi.getPatientDetail({ visit_no: r.visit_no }),
        ...(datasetUid
          ? [
              warehouseApi.getParsedPatientDetail({
                visit_no: r.visit_no,
                dataset_uid: datasetUid,
              }),
            ]
          : []),
      ])
        .then(([detailRes, parsedRes]) => {
          console.log('detailRes', detailRes);
          console.log('parsedRes', parsedRes);

          if (
            detailRes.status === 'fulfilled' &&
            detailRes.value.code === 200
          ) {
            // 打开患者详情弹窗
            console.log('获取患者详情成功', detailRes);
            setDetail(detailRes.value.data);
          } else {
            console.error('获取患者详情失败:', detailRes);
            message.error(
              `获取患者详情失败: ${detailRes.status === 'fulfilled' ? detailRes.value.message : '请求失败'}`,
            );
          }

          if (parsedRes) {
            if (
              parsedRes.status === 'fulfilled' &&
              parsedRes.value.code === 200
            ) {
              console.log('获取患者解析后详情成功', parsedRes);
              setParsedData(parsedRes.value.data);
            } else {
              console.error('获取患者解析后详情失败:', parsedRes);
              message.error(
                `获取患者解析后详情失败: ${parsedRes.status === 'fulfilled' ? parsedRes.value.message : '请求失败'}`,
              );
            }
          }
        })
        .finally(() => setGetDetailLoading(false));
    },
    [datasetUid],
  );

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
        isParsed={!!datasetUid}
        parsedDetail={parsedDetail}
        loading={getDetailLoading}
      />

      <div className="flex gap-x-[8px] items-center mb-[24px]">
        <span>查询数据</span>
        <Input.Search
          className="w-[360px]"
          placeholder="输入关键字查询"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          onSearch={onSearch}
        />
      </div>

      <Table<Record<string, string>>
        loading={loading}
        scroll={{ x: true }}
        dataSource={showData?.data}
        rowKey={(r) => JSON.stringify(r).substring(0, 72)}
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
        onRow={(r, i) => ({
          onClick: () => onClickPatient(r),
          className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
        })}
      >
        {data?.columns.map((c) => (
          <Table.Column
            title={c.label}
            dataIndex={c.value}
            key={c.value}
            render={(v: string) => {
              const text = v
                ? v.trim().replace(/　+/g, ' ').replace(/ +/g, ' ')
                : '-';
              const pre = text.substring(0, 16);
              const suf = text.substring(text.length - 10);
              const display = text.length > 40 ? `${pre} ...... ${suf}` : text;
              return <p title={text}>{display}</p>;
            }}
            ellipsis={{ showTitle: false }}
            className="cursor-pointer"
          />
        ))}
      </Table>
    </>
  );
};
