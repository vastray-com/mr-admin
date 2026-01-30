import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Spin,
} from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { DatasetFilterDisplay } from '@/pages/DatasetManagement/components/DatasetFilterDisplay';
import { WarehouseDataTable } from '@/pages/DatasetManagement/components/WarehouseDataTable';
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

  // 动态禁用已关联的资源类型选项
  const linked = Form.useWatch('content', form);
  const resourceOptions = useMemo(() => {
    if (!linked) return ENUM_VARS.DATASET.RESOURCE_TYPE_OPT;
    console.log('linked:', linked);
    const hasLinkedResource = linked.map((r) => r.resource_type);
    return ENUM_VARS.DATASET.RESOURCE_TYPE_OPT.map((opt) => ({
      ...opt,
      disabled: hasLinkedResource.includes(opt.value),
    }));
  }, [linked]);

  // 过滤器展示模式
  const filterDisplayMode = [
    { value: 'form', label: '表单模式' },
    { value: 'json', label: ' JSON 模式' },
  ] as const;
  const [curFilterDisplayMode, setCurFilterDisplayMode] = useState<
    (typeof filterDisplayMode)[number]['value']
  >(filterDisplayMode[0].value);
  const nextFilterDisplayMode = useMemo(() => {
    const idx = filterDisplayMode.findIndex(
      (m) => m.value === curFilterDisplayMode,
    );
    return filterDisplayMode[(idx + 1) % filterDisplayMode.length];
  }, [curFilterDisplayMode]);
  const onFilterDisplayModeChange = useCallback(() => {
    if (!detail) return;
    const idx = filterDisplayMode.findIndex(
      (m) => m.value === curFilterDisplayMode,
    );
    const nextIdx = (idx + 1) % filterDisplayMode.length;
    setCurFilterDisplayMode(filterDisplayMode[nextIdx].value);
  }, [curFilterDisplayMode, detail]);

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
          <>
            <Button type="primary" onClick={() => console.log('交互式分析')}>
              交互式分析
            </Button>
            <Button
              danger
              className="ml-[8px]"
              onClick={() => onAction(uid, 'delete')}
            >
              删除数据集
            </Button>
          </>
        }
      >
        {detail.warning_msg && (
          <Alert
            className="mb-[16px]"
            title={detail.warning_msg}
            type="warning"
            showIcon
          />
        )}

        <Card title="数据集信息">
          <Descriptions
            size="small"
            bordered
            layout="vertical"
            column={4}
            items={[
              {
                key: 'name_cn',
                label: '数据集名称',
                children: detail.name_cn,
              },
              {
                key: 'name_en',
                label: '数据集标识',
                children: detail.name_en,
              },
              {
                key: 'dataset_type',
                label: '数据集类型',
                children: ENUM_VARS.DATASET.TYPE_MAP[detail.dataset_type],
              },
              {
                key: 'source_type',
                label: '数据源类型',
                children: ENUM_VARS.DATASET.SOURCE_TYPE_MAP[detail.source_type],
              },
              {
                key: 'filter',
                label: (
                  <div className="flex items-center gap-x-[8px]">
                    <span>数据过滤器</span>
                    <Button
                      type="link"
                      onClick={() => onFilterDisplayModeChange()}
                    >
                      <span className="flex items-center gap-x-[4px]">
                        <i className="i-icon-park-outline:switch text-[14px]" />
                        <span>{`切换到${nextFilterDisplayMode.label}`}</span>
                      </span>
                    </Button>
                  </div>
                ),
                children: (
                  <div className="max-h-[480px] overflow-auto">
                    {curFilterDisplayMode === 'json' ? (
                      <pre>{JSON.stringify(detail.filter, null, 2)}</pre>
                    ) : curFilterDisplayMode === 'form' ? (
                      <DatasetFilterDisplay filter={detail.filter} />
                    ) : null}
                  </div>
                ),
                span: 4,
              },
              {
                key: 'linked_ruleset',
                label: (
                  <div className="flex items-center gap-x-[8px]">
                    <span>已关联解析规则</span>
                    <Button type="link" onClick={() => setShowLinkModal(true)}>
                      编辑关联规则
                    </Button>
                  </div>
                ),
                children: (
                  <div>
                    {detail.linked_ruleset.length === 0
                      ? '暂未关联解析规则'
                      : detail.linked_ruleset.map((l) => (
                          <div
                            key={l.resource_type}
                            className="flex items-center gap-x-[16px] py-[8px] first:mt-0"
                          >
                            <span className="w-[4px] h-[4px] bg-[#666]" />
                            <span>
                              {
                                ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[
                                  l.resource_type
                                ]
                              }
                            </span>
                            <i className="i-icon-park-outline:arrow-right text-[16px] text-fg-tertiary" />
                            <span>
                              {
                                rulesetOptions.find(
                                  (r) => r.value === l.structured_ruleset_uid,
                                )?.label
                              }
                            </span>
                          </div>
                        ))}
                  </div>
                ),
                span: 4,
              },
            ]}
          />
        </Card>

        <Card className="mt-[16px]" title="数据集患者列表（前 1000 条）">
          <WarehouseDataTable filter={detail.filter} showMessage />
        </Card>
      </ContentLayout>

      <Modal
        centered
        onCancel={() => setShowLinkModal(false)}
        afterOpenChange={() => form.resetFields()}
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
                          options={resourceOptions}
                        />
                      </Form.Item>

                      <i className="i-icon-park-outline:arrow-right text-[20px] text-fg-tertiary mt-[6px]" />

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
                保存
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DatasetDetailPage;
