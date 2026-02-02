import { Descriptions, Empty, Modal, Spin } from 'antd';
import type { FC } from 'react';
import type { Warehouse } from '@/typing/warehose';

type Props = {
  loading: boolean;
  open: boolean;
  onClose: () => void;
  detail?: Warehouse.PatientDetail | null;
};
export const WarehousePatientDetailModal: FC<Props> = ({
  loading,
  detail,
  open,
  onClose,
}) => {
  return (
    <Modal
      centered
      onCancel={() => onClose()}
      open={open}
      title="患者明细信息"
      classNames={{
        body: 'h-[80vh]',
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
      {!loading && !detail && <Empty description="暂无患者明细信息" />}
      {!loading && detail && (
        <div className="h-full overflow-y-auto overflow-x-hidden pr-[16px]">
          {detail.map((d) => (
            <Descriptions
              className="mt-[48px] first:mt-[16px]"
              key={d.name}
              title={d.label}
              items={d.columns
                .filter((c) => {
                  // 仅展示有数据的字段
                  return ![undefined, null, 'NULL'].includes(
                    d.data[0][c.value],
                  );
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
      )}
    </Modal>
  );
};
