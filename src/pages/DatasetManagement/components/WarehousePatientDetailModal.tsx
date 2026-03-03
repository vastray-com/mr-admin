import { Descriptions, Empty, Modal, Segmented, Spin } from 'antd';
import { type FC, useEffect, useState } from 'react';
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
  return detail && detail.length > 0 ? (
    <div className="h-[calc(100%_-_64px)] overflow-y-auto overflow-x-hidden pr-[16px]">
      {detail.map((d) => (
        <Descriptions
          className="mt-[48px] first:mt-[16px]"
          key={d.name}
          title={d.label}
          items={d.columns
            .filter((c) => {
              // 仅展示有数据的字段
              return ![undefined, null, 'NULL'].includes(d.data[0][c.value]);
            })
            .map((c) => ({
              key: c.value,
              label: c.label,
              children: <p>{d.data[0][c.value] ?? '—'}</p>,
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
