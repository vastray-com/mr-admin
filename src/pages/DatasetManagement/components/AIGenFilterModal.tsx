import { Input, Modal } from 'antd';
import type { FC } from 'react';

export const AIGenBtnStyle = {
  border: 'none',
  background: 'linear-gradient(135deg,#c621e5,#7d7cf9)',
};

type Props = {
  open: boolean;
  generating: boolean;
  placeholder?: string;
  value: string;
  onChange: (content: string) => void;
  onClose: () => void;
  onGenerate: () => void;
};

export const AIGenFilterModal: FC<Props> = ({
  open,
  generating,
  placeholder,
  value,
  onChange,
  onClose,
  onGenerate,
}) => {
  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="AI 生成数据集过滤条件"
      width={830}
      onOk={onGenerate}
      okText={generating ? '生成中' : '开始生成'}
      okButtonProps={{
        loading: generating,
        style: AIGenBtnStyle,
      }}
    >
      <div className="py-[8px]">
        <Input.TextArea
          rows={8}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Modal>
  );
};
