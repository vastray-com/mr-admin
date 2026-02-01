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
import { DatasetFilterForm } from '@/pages/DatasetManagement/components/DatasetFilterForm';
import { datasetFilterFE2DB } from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';

type Props = {
  form: FormInstance<Dataset.InputCreateParams>;
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
};

export const CreateDatasetModal: FC<Props> = ({
  form,
  open,
  onClose,
  onFinish,
}) => {
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  const _onFinish = useCallback(
    async (values: Dataset.InputCreateParams) => {
      console.log('提交的新数据集：', values);
      try {
        const res = await datasetApi.createDataset({
          ...values,
          filter: datasetFilterFE2DB(values.filter),
        });
        if (res.code === 200) {
          message.success('数据集创建成功');
          onClose();
          form.resetFields();
          onFinish?.();
        } else {
          message.error(`创建数据集失败：${res.message}`);
        }
      } catch (error) {
        console.error('创建数据集失败：', error);
        message.error('创建数据集失败，请稍后重试');
      }
    },
    [datasetApi, form.resetFields, message],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="新建数据集"
      width={830}
      footer={null}
    >
      <Form<Dataset.InputCreateParams>
        className="mt-[36px]"
        form={form}
        name="new-dataset-form"
        onFinish={_onFinish}
        onFinishFailed={(v) => {
          console.log('表单提交失败：', v);
        }}
        autoComplete="off"
        labelCol={{ span: 4 }}
      >
        <Form.Item<Dataset.InputCreateParams>
          label="数据集类型"
          name="dataset_type"
          rules={[
            {
              required: true,
              message: '请选择数据集类型',
            },
          ]}
        >
          <Select
            options={ENUM_VARS.DATASET.TYPE_OPT}
            placeholder="选择数据集类型"
          />
        </Form.Item>

        <Form.Item<Dataset.InputCreateParams>
          label="数据源类型"
          name="source_type"
          rules={[
            {
              required: true,
              message: '请选择数据源类型',
            },
          ]}
        >
          <Select
            options={ENUM_VARS.DATASET.SOURCE_TYPE_OPT}
            placeholder="选择数据源类型"
          />
        </Form.Item>

        <Form.Item<Dataset.InputCreateParams>
          label="数据集名称"
          name="name_cn"
          rules={[
            {
              required: true,
              message: '请输入数据集名称',
            },
          ]}
        >
          <Input placeholder="输入数据集名称" />
        </Form.Item>

        <Form.Item<Dataset.InputCreateParams>
          label="数据集标识"
          name="name_en"
          rules={[
            {
              required: true,
              message: '请输入数据集标识',
            },
          ]}
        >
          <Input placeholder="输入数据集标识" />
        </Form.Item>

        <DatasetFilterForm
          name="filter"
          sourceTypeName="source_type"
          form={form}
        />

        <Form.Item noStyle>
          <div className="flex items-center justify-center mt-[36px]">
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
