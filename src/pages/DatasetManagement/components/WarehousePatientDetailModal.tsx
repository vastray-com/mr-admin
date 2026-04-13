import { Descriptions, Empty, Modal, Segmented, Spin } from 'antd';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import type { Warehouse } from '@/typing/warehose';

const segmentedOption: { label: string; value: string }[] = [
  {
    label: '原始数据',
    value: 'raw',
  },
  {
    label: '解析结果',
    value: 'parsed',
  },
];
type SegmentedOption = (typeof segmentedOption)[number]['value'];

type Props = {
  loading: boolean;
  open: boolean;
  onClose: () => void;
  detail?: Warehouse.PatientDetail | null;
  isParsed: boolean;
  parsedDetail: Warehouse.PatientDetail | null;
};
export const WarehousePatientDetailModal: FC<Props> = ({
  loading,
  detail,
  open,
  onClose,
  isParsed,
  parsedDetail,
}) => {
  const [segmented, setSegmented] = useState<SegmentedOption>(
    segmentedOption[0].value,
  );
  useEffect(() => {
    if (!open) {
      setSegmented(segmentedOption[0].value);
    }
  }, [open]);

  return (
    <Modal
      centered
      onCancel={() => onClose()}
      open={open}
      title="患者明细信息"
      classNames={{
        body: 'h-[72vh]',
      }}
      width={1000}
      footer={null}
    >
      {loading && (
        <div className="h-full flex gap-x-[8px] justify-center items-center">
          <Spin percent="auto" spinning />
          <p>患者详情加载中...</p>
        </div>
      )}

      {!loading && !detail && isParsed && !parsedDetail && (
        <Empty className="mt-[80px]" description="暂无患者明细信息" />
      )}

      {!loading && isParsed && (
        <div className="flex items-center justify-center py-[16px]">
          <Segmented<SegmentedOption>
            options={segmentedOption}
            onChange={setSegmented}
          />
        </div>
      )}

      {!loading && segmented === 'raw' && detail && (
        <DetailDesc detail={detail} />
      )}

      {!loading && segmented === 'parsed' && parsedDetail && (
        <DetailDesc detail={parsedDetail} />
      )}
    </Modal>
  );
};

const DetailDesc: FC<{ detail?: Warehouse.PatientDetail | null }> = ({
  detail,
}) => {
  // 需要展示的数据
  const displayData = useMemo(() => {
    if (detail && detail.length > 0) {
      const data = detail
        .map((d) => {
          const detail = d.data[0];
          if (!detail) return null;

          const cols = d.columns.filter(
            (c) => ![undefined, null, 'NULL'].includes(detail[c.value]),
          );
          return {
            ...d,
            columns: cols,
          };
        })
        .filter(Boolean) as Warehouse.PatientDetail;

      console.log('展示的患者详情数据', data);

      return data;
    } else {
      return [];
    }
  }, [detail]);

  const renderRecord = useCallback((record: Record<string, string>) => {
    return Object.keys(record).length === 0 ? (
      <p>-</p>
    ) : (
      <div>
        {Object.entries(record).map(([k, v]) => (
          <p
            className="leading-[20px] mt-[8px] first:mt-0"
            key={k}
          >{`${k}: ${v}`}</p>
        ))}
      </div>
    );
  }, []);

  const renderValue = useCallback(
    (
      value:
        | string
        | number
        | Record<string, string>[]
        | string[]
        | Record<string, string>,
    ) => {
      if (!value) return <p>-</p>;
      switch (typeof value) {
        case 'string':
        case 'number':
        case 'bigint':
          return <p>{value}</p>;
        case 'boolean':
          return <p>{value ? '是' : '否'}</p>;
        case 'object':
          if (Array.isArray(value)) {
            if (value.length === 0) {
              return <p>-</p>;
            } else if (typeof value[0] === 'string') {
              return (
                <div>
                  {(value as string[]).map((v) => (
                    <p key={v} className="flex mt-[8px] first:mt-0">
                      <span className="w-[6px] h-[6px] rounded-full bg-blue mr-[8px] shrink-0 grow-0 basis-[6px] mt-[9px]" />
                      <span className="leading-[24px]">{v}</span>
                    </p>
                  ))}
                </div>
              );
            } else {
              return (value as Record<string, string>[]).map((v) => (
                <div
                  key={JSON.stringify(v)}
                  className="flex mt-[12px] first:mt-0"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-blue mr-[8px] shrink-0 grow-0 basis-[6px] mt-[7px]" />
                  <div>{renderRecord(v)}</div>
                </div>
              ));
            }
          } else {
            return renderRecord(value);
          }
        default:
          return <p>{String(value)}</p>;
      }
    },
    [],
  );

  return displayData.length > 0 ? (
    <div className="h-[calc(100%_-_64px)] overflow-y-auto overflow-x-hidden pr-[16px]">
      {displayData.map((d) => (
        <Descriptions
          className="mt-[48px] first:mt-[16px]"
          key={d.name}
          title={d.label}
          items={d.columns.map((c) => ({
            key: c.value,
            label: c.label,
            children: renderValue(d.data[0][c.value]),
            span: c.data_length > 100 ? 3 : 1,
          }))}
          column={3}
          bordered
          layout="vertical"
          size="middle"
        />
      ))}
    </div>
  ) : (
    <Empty className="mt-[80px]" description="空数据" />
  );
};
