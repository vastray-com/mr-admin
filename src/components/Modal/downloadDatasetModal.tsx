import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
} from 'antd';
import { type FC, useCallback, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { ENUM_VARS } from '@/typing/enum';
import { DatasetType } from '@/typing/enum/dataset';
import type { DownloadTask } from '@/typing/downloadTask';

type DownloadDatasetModalProps = {
  datasetUid: string;
  datasetType: DatasetType;
  templates: DownloadTask.Templates;
  open: boolean;
  onClose: () => void;
};
export const DownloadDatasetModal: FC<DownloadDatasetModalProps> = ({
  datasetUid,
  datasetType,
  templates = [],
  open,
  onClose,
}) => {
  const { message } = App.useApp();
  const { downloadTaskApi } = useApi();
  const [form] = Form.useForm<DownloadTask.CreateParamsFE>();

  const [downloadType, setDownloadType] = useState<'normal' | 'quality'>(
    'normal',
  );
  const [loading, setLoading] = useState(false);

  const onFinish = useCallback(
    (v: DownloadTask.CreateParamsFE) => {
      console.log('数据集下载申请', v);
      const params: DownloadTask.CreateParams = {
        dataset_uid: v.dataset_uid,
        resource_list: downloadType === 'normal' ? v.resource_list : undefined,
        template_name: downloadType === 'quality' ? v.template_name : undefined,
        archive_uid: v.archive_uid,
      };
      if (v.date_range) {
        params.from_date = v.date_range[0].format('YYYY-MM-DD');
        params.to_date = v.date_range[1].format('YYYY-MM-DD');
      }

      // 提交下载申请
      setLoading(true);
      downloadTaskApi
        .createDownloadTask(params)
        .then((res) => {
          if (res.code === 200) {
            message.success('数据集下载申请成功，请等待审核');
            onClose();
          } else {
            message.error(`数据集下载申请失败：${res.message}`);
          }
        })
        .catch((e) => {
          console.error('数据集下载申请失败：', e);
          message.error('数据集下载申请失败，请稍后重试');
        })
        .finally(() => setLoading(false));
    },
    [downloadType],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      afterOpenChange={() => form.resetFields()}
      open={open}
      title="数据集下载"
      width={830}
      footer={null}
    >
      <Form<DownloadTask.CreateParamsFE>
        className="mt-[16px]"
        form={form}
        name="create-download-task-form"
        onFinish={onFinish}
        onFinishFailed={(v) => {
          console.log('表单提交失败：', v);
        }}
        initialValues={{
          dataset_uid: datasetUid,
          resource_list: [],
          template_name: undefined,
        }}
        autoComplete="off"
        requiredMark={false}
      >
        <div className="mb-[24px]">
          <Radio.Group
            value={downloadType}
            onChange={(e) => setDownloadType(e.target.value)}
          >
            <Radio.Button value="normal">普通下载</Radio.Button>
            <Radio.Button value="quality">质控下载</Radio.Button>
          </Radio.Group>
        </div>

        <Form.Item<DownloadTask.CreateParamsFE> hidden name="dataset_uid">
          <Input />
        </Form.Item>

        {downloadType === 'normal' && (
          <Form.Item<DownloadTask.CreateParamsFE>
            label="资源类型"
            name="resource_list"
            rules={[
              {
                required: true,
                message: '请至少选择一个资源类型',
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="选择要下载的资源类型"
              options={ENUM_VARS.DATASET.RESOURCE_TYPE_OPT}
              allowClear
              showSearch={{
                filterOption: (input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
            />
          </Form.Item>
        )}

        {downloadType === 'quality' && (
          <Form.Item<DownloadTask.CreateParamsFE>
            label="质控模版"
            name="template_name"
            rules={[
              {
                required: true,
                message: '请选择一个质控模版',
              },
            ]}
          >
            <Select
              placeholder="选择质控模版"
              options={templates.map((t) => ({ label: t.name, value: t.name }))}
              allowClear
              showSearch={{
                filterOption: (input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
            />
          </Form.Item>
        )}

        {datasetType === DatasetType.Subscribe && (
          <Form.Item<DownloadTask.CreateParamsFE>
            label="下载范围"
            name="date_range"
            rules={[
              {
                required: true,
                message: '订阅数据集必须选择时间范围',
              },
            ]}
          >
            <DatePicker.RangePicker />
          </Form.Item>
        )}

        <Form.Item noStyle>
          <div className="flex items-center justify-center mt-[36px]">
            <Button type="primary" htmlType="submit" loading={loading}>
              申请下载
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
