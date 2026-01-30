import {
  App,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Spin,
} from 'antd';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { WarehouseDataTable } from '@/pages/DatasetManagement/Dataset/components/WarehouseDataTable';
import { useCacheStore } from '@/store/useCacheStore';
import { ENUM_VARS } from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';

const DatasetDetailPage = () => {
  const { uid } = useParams<{ uid: string }>();
  const { datasetApi } = useApi();
  const { message } = App.useApp();
  const nav = useNavigate();

  const rulesetOptions = useCacheStore((s) => s.structuredRulesetOptions);

  const [detail, setDetail] = useState<Dataset.Item | null>(null);
  const fetchDetail = useCallback(
    async (uid: string) => {
      const res = await datasetApi.getDatasetDetail({ uid });
      console.log('拉取数据集详情成功:', res);
      setDetail(res.data);
    },
    [datasetApi],
  );

  const onAction = useCallback(
    (uid: string, action: Dataset.ActionParams['action']) => {
      console.log(`执行操作：${action}，数据集 ID：${uid}`);
      if (action === 'delete') {
        datasetApi
          .deleteDataset(uid)
          .then((res) => {
            if (res.code === 200) {
              message.success(`操作成功`);
              nav(-1);
            } else {
              message.error(`操作失败：${res.message}`);
            }
          })
          .catch((err) => {
            console.error(`操作任务失败：`, err);
            message.error('操作任务失败，请稍后重试');
          });
      }
    },
    [datasetApi, message.error, message.success, nav],
  );

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [form] = Form.useForm<Dataset.LinkParams>();
  const onLinkFinish = useCallback(
    (values: Dataset.LinkParams) => {
      console.log('关联规则集', values);
      datasetApi
        .linkRuleset(values)
        .then(async (res) => {
          if (res.code === 200) {
            await fetchDetail(values.dataset_uid);
            message.success(`关联成功`);
            setShowLinkModal(false);
          } else {
            message.error(`关联失败：${res.message}`);
          }
        })
        .catch((err) => {
          console.error(`关联失败：`, err);
          message.error('关联失败，请稍后重试');
        });
    },
    [datasetApi.linkRuleset, fetchDetail, message.error, message.success],
  );

  if (!uid) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-4">
        缺少数据集 ID 参数
      </div>
    );
  }

  if (!detail) {
    fetchDetail(uid);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-4">
        <Spin />
        <p>加载数据中，请稍候...</p>
      </div>
    );
  }

  return (
    <>
      <ContentLayout
        title="数据集详情"
        action={
          <Button
            danger
            type="primary"
            className="ml-[8px]"
            onClick={() => onAction(uid, 'delete')}
          >
            删除数据集
          </Button>
        }
      >
        <Card>
          <p>{JSON.stringify(detail, null, 2)}</p>
          <Button onClick={() => setShowLinkModal(true)}>关联规则集</Button>
        </Card>

        <Card>
          <WarehouseDataTable filter={detail.filter} showMessage />
        </Card>
      </ContentLayout>

      <Modal
        centered
        onCancel={() => setShowLinkModal(false)}
        destroyOnHidden
        open={showLinkModal}
        title="关联规则集"
        width={830}
        footer={null}
      >
        <Form<Dataset.LinkParams>
          className="mt-[36px]"
          form={form}
          name="new-task-form"
          onFinish={onLinkFinish}
          onFinishFailed={(v) => {
            console.log('表单提交失败：', v);
          }}
          initialValues={{
            dataset_uid: uid,
            content: detail.linked_ruleset ?? [],
          }}
          autoComplete="off"
          labelCol={{ span: 4 }}
        >
          <Form.Item<Dataset.LinkParams> hidden name="dataset_uid">
            <Input />
          </Form.Item>

          <Form.Item label="关联规则">
            <Form.List name="content">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Flex gap={16} key={key} className="mb-[12px]">
                      <Form.Item
                        {...restField}
                        name={[name, 'resource_type']}
                        className="flex-1"
                      >
                        <Select
                          placeholder="请选择资源类型"
                          options={ENUM_VARS.DATASET.RESOURCE_TYPE_OPT}
                        />
                      </Form.Item>

                      <i className="i-icon-park-outline:arrow-right text-[20px] text-fg-tertiary" />

                      <Form.Item
                        {...restField}
                        name={[name, 'structured_ruleset_uid']}
                        className="flex-1"
                      >
                        <Select
                          placeholder="请选择关联规则"
                          options={rulesetOptions}
                        />
                      </Form.Item>

                      <Button
                        danger
                        onClick={() => remove(name)}
                        icon={<i className="i-line-md:trash text-[20px]" />}
                      >
                        删除关联
                      </Button>
                    </Flex>
                  ))}

                  <Button
                    block
                    type="dashed"
                    onClick={add}
                    icon={
                      <i className="i-line-md:plus-circle text-[20px] fg-secondary" />
                    }
                  >
                    添加关联类型
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item noStyle>
            <div className="flex items-center justify-center mt-[36px]">
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DatasetDetailPage;
