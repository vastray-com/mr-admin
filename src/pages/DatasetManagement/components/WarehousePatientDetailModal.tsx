import { Descriptions, Divider, Empty, Modal, Spin } from 'antd';
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
      width={1000}
      classNames={{
        body: 'h-[80vh] overflow-y-auto',
      }}
      footer={null}
    >
      {loading && (
        <div className="h-full flex gap-x-[8px] justify-center items-center">
          <Spin percent="auto" spinning />
          <p>患者详情加载中...</p>
        </div>
      )}
      {!loading && !detail && <Empty description="暂无患者明细信息" />}
      {!loading &&
        detail &&
        detail.map((d, i) => (
          <>
            {i > 0 && <Divider />}
            <Descriptions
              key={d.name}
              title={d.label}
              items={d.columns.map((c) => ({
                key: c.value,
                label: c.label,
                children: d.data[0][c.value] ?? '—',
              }))}
            />
          </>
        ))}
    </Modal>
  );
};
