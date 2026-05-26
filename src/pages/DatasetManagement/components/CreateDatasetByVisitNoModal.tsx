import {
  App,
  Button,
  Form,
  type FormInstance,
  Input,
  Modal,
  Select,
} from 'antd';
import { type FC, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import { normalizeVisitNos } from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import { DatasetType } from '@/typing/enum/dataset';
import type { Dataset } from '@/typing/dataset';

type Props = {
  form: FormInstance<Dataset.InputCreateByVisitNoParams>;
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
};

export const CreateDatasetByVisitNoModal: FC<Props> = ({
  form,
  open,
  onClose,
  onFinish,
}) => {
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  const submit = useCallback(
    async (values: Dataset.InputCreateByVisitNoParams) => {
      const visitNos = normalizeVisitNos(values.visit_no_text);
      if (visitNos.length < 1) {
        message.warning('请至少填写一个有效的 visit_no');
        return;
      }

      try {
        const res = await datasetApi.createDataset({
          name_cn: values.name_cn,
          name_en: values.name_en,
          dataset_type: DatasetType.Review,
          source_type: values.source_type,
          filter: visitNos,
        });

        if (res.code === 200) {
          message.success('ID 入组数据集创建成功');
          onClose();
          form.resetFields();
          onFinish?.();
          return;
        }

        message.error(`创建失败：${res.message}`);
      } catch (error) {
        console.error('创建 ID 入组数据集失败：', error);
        message.error('创建失败，请稍后重试');
      }
    },
    [datasetApi, form, message, onClose, onFinish],
  );

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      title="ID 入组创建数据集"
      width={700}
      footer={null}
    >
      <Form<Dataset.InputCreateByVisitNoParams>
        className="mt-[24px]"
        form={form}
        onFinish={submit}
        autoComplete="off"
        labelCol={{ span: 4 }}
      >
        <Form.Item<Dataset.InputCreateByVisitNoParams>
          label="数据源类型"
          name="source_type"
          rules={[{ required: true, message: '请选择数据源类型' }]}
        >
          <Select
            options={ENUM_VARS.DATASET.SOURCE_TYPE_OPT}
            placeholder="选择门诊或住院"
          />
        </Form.Item>

        <Form.Item<Dataset.InputCreateByVisitNoParams>
          label="数据集名称"
          name="name_cn"
          rules={[{ required: true, message: '请输入数据集名称' }]}
        >
          <Input placeholder="输入数据集名称" />
        </Form.Item>

        <Form.Item<Dataset.InputCreateByVisitNoParams>
          label="数据集标识"
          name="name_en"
          rules={[
            { required: true, message: '请输入数据集标识' },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: '标识只能包含字母、数字和下划线',
            },
          ]}
        >
          <Input placeholder="输入数据集标识" />
        </Form.Item>

        <Form.Item<Dataset.InputCreateByVisitNoParams>
          label="就诊流水号"
          name="visit_no_text"
          extra="每行一个 visit_no，支持粘贴多行。"
          rules={[{ required: true, message: '请输入就诊流水号' }]}
        >
          <Input.TextArea
            rows={8}
            placeholder={'例如:\n123456\n123457\n123458'}
          />
        </Form.Item>

        <Form.Item noStyle>
          <div className="flex items-center justify-center mt-[24px]">
            <Button type="primary" htmlType="submit">
              创建回顾型数据集
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
