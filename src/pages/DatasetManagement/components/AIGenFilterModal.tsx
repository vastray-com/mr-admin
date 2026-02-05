import { App, Input, Modal } from 'antd';
import { type FC, useCallback, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import type { AxiosError } from 'axios';

export const AIGenBtnStyle = {
  border: 'none',
  background: 'linear-gradient(135deg,#c621e5,#7d7cf9)',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onResponse?: (res: string) => void;
};

export const AIGenFilterModal: FC<Props> = ({ open, onClose, onResponse }) => {
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState('');

  const onGenerate = useCallback(async (content: string) => {
    console.log('开始 AI 生成过滤条件: ', content);
    setGenerating(true);

    try {
      const res = await datasetApi.genAIFilter({ content });
      if (res.code === 200) {
        onResponse?.(res.data);
      } else {
        message.error(`生成过滤条件失败: ${res.message}`);
      }
    } catch (error) {
      const e = error as AxiosError<APIRes<any>>;
      console.error('生成过滤条件失败: ', e);
      message.error(
        `生成过滤条件失败: ${e.response?.data.message || e.message}`,
      );
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="AI 生成数据集过滤条件"
      width={830}
      onOk={() => onGenerate(content)}
      okText={generating ? '生成中' : '开始生成'}
      okButtonProps={{
        loading: generating,
        style: AIGenBtnStyle,
      }}
    >
      <div className="py-[8px]">
        <Input.TextArea
          rows={8}
          placeholder="请描述你想要的过滤条件，例如：筛选出年龄大于30岁且居住在北京的肺癌患者"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    </Modal>
  );
};
