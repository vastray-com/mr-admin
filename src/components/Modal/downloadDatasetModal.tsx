import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Tag,
} from 'antd';
import { type FC, useCallback, useMemo, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
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
  const resourceTypeOptions = useCacheStore((s) => s.resourceTypeOptions);
  const [form] = Form.useForm<DownloadTask.CreateParamsFE>();

  const [downloadType, setDownloadType] = useState<'normal' | 'quality'>(
    'normal',
  );
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>();

  const templateTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach((template) => {
      const val = template.tag?.trim();
      if (val) {
        tagSet.add(val);
      }
    });
    return Array.from(tagSet).sort();
  }, [templates]);

  const filteredTemplates = useMemo(
    () =>
      selectedTag
        ? templates.filter((template) => template.tag === selectedTag)
        : templates,
    [templates, selectedTag],
  );

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
    [downloadType, downloadTaskApi, message, onClose],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      afterOpenChange={() => {
        form.resetFields();
        setSelectedTag(undefined);
      }}
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
              options={resourceTypeOptions}
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
          <>
            <Form.Item label="标签过滤">
              <Select
                placeholder="按标签筛选模板"
                value={selectedTag}
                options={templateTags.map((tag) => ({
                  label: tag,
                  value: tag,
                }))}
                allowClear
                onChange={(val) => setSelectedTag(val)}
              />
            </Form.Item>

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
                options={filteredTemplates.map((t) => ({
                  label: (
                    <div className="flex items-center gap-[8px]">
                      <span>{t.name}</span>{' '}
                      {t.creator_name ? (
                        <Tag color="blue">{`创建人: ${t.creator_name}`}</Tag>
                      ) : null}{' '}
                      {t.tag ? (
                        <Tag key={`${t.uid}-${t.tag}`}>{t.tag}</Tag>
                      ) : null}
                    </div>
                  ),
                  value: t.uid,
                  searchLabel: `${t.name} ${t.creator_name ?? ''} ${t.tag ?? ''}`,
                }))}
                allowClear
                showSearch={{
                  filterOption: (input, option) =>
                    ((option?.searchLabel as string) ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase()),
                }}
              />
            </Form.Item>
          </>
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
