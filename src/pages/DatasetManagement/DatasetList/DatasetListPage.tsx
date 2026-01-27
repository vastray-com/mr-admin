import {
  App,
  Button,
  Card,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import {
  datasetFilterDB2FE,
  datasetFilterFE2DB,
} from '@/pages/DatasetManagement/DatasetList/helper';
import {
  type DatasetType,
  datasetFilterLogicOptions,
  datasetFilterOperatorOptions,
  datasetFilterTableOptions,
  datasetTypeMap,
  datasetTypeOptions,
} from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';

const DatasetListPage = () => {
  const { datasetApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<Dataset.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: datasetApi.getDatasetList,
    setData: setData,
  });

  // 新建数据集
  const [form] = Form.useForm<Dataset.InputCreateParams>();
  const newDatasetData = useRef<Dataset.InputCreateParams | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    form.resetFields();
    setShowCreateModal(true);
  };
  const onCopy = (record: Dataset.Item) => {
    console.log('xxx', record);
    form.resetFields();
    newDatasetData.current = {
      name_cn: `${record.name_cn}_Copy`,
      name_en: '',
      dataset_type: record.dataset_type,
      filter: datasetFilterDB2FE(record.filter),
    };
    console.log('复制的数据集：', newDatasetData.current);
    form.setFieldsValue(newDatasetData.current);
    // 打开新建任务模态框
    setShowCreateModal(true);
  };

  const onAction = useCallback(
    (uid: string, action: Dataset.ActionParams['action']) => {
      console.log(`执行操作：${action}，数据集 ID：${uid}`);
      datasetApi
        .actionDataset({ uid, action })
        .then((res) => {
          if (res.code === 200) {
            message.success(`操作成功`);
            // 刷新任务列表
            refresh();
          } else {
            message.error(`操作失败：${res.message}`);
          }
        })
        .catch((err) => {
          console.error(`操作任务失败：`, err);
          message.error('操作任务失败，请稍后重试');
        });
    },
    [datasetApi, refresh, message.error, message.success],
  );

  const onFinish = useCallback(
    async (values: Dataset.InputCreateParams) => {
      console.log('提交的新数据集：', values);
      try {
        const res = await datasetApi.createDataset({
          ...values,
          filter: datasetFilterFE2DB(values.filter),
        });
        if (res.code === 200) {
          message.success('数据集创建成功');
          setShowCreateModal(false);
          form.resetFields();
          // 刷新任务列表
          refresh();
        } else {
          message.error(`创建数据集失败：${res.message}`);
        }
      } catch (error) {
        console.error('创建数据集失败：', error);
        message.error('创建数据集失败，请稍后重试');
      }
    },
    [datasetApi, refresh, form.resetFields, message.error, message.success],
  );

  return (
    <>
      <ContentLayout
        title="数据集列表"
        action={
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建数据集
          </Button>
        }
      >
        <Card>
          <Table<Dataset.Item>
            dataSource={data}
            rowKey="uid"
            pagination={false}
          >
            <Table.Column title="数据集编号" dataIndex="uid" />
            <Table.Column title="数据集名称" dataIndex="name_cn" />
            <Table.Column
              title="数据集类型"
              dataIndex="dataset_type"
              render={(type: DatasetType) => datasetTypeMap[type]}
            />
            <Table.Column title="警告信息" dataIndex="warning_msg" />
            <Table.Column
              title="创建时间"
              dataIndex="created_at"
              render={(time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
            />
            {/*<Table.Column*/}
            {/*  title="状态"*/}
            {/*  dataIndex="status"*/}
            {/*  render={(status: TaskStatus) => {*/}
            {/*    return (*/}
            {/*      <p className="flex gap-x-[6px] items-center">*/}
            {/*        <span*/}
            {/*          style={{ background: statusDisplay[status][0] }}*/}
            {/*          className={clsx('w-[6px] h-[6px] rounded-full')}*/}
            {/*        />*/}
            {/*        <span>{statusDisplay[status][1]}</span>*/}
            {/*      </p>*/}
            {/*    );*/}
            {/*  }}*/}
            {/*/>*/}
            <Table.Column
              title="操作"
              key="action"
              width={280}
              render={(_, record: Dataset.Item) => (
                <>
                  <Button type="link" onClick={() => onCopy(record)}>
                    复制
                  </Button>
                  <Link to={`/dataset_management/detail/${record.uid}`}>
                    <Button type="link">详情</Button>
                  </Link>
                  <Button
                    type="link"
                    danger
                    onClick={() => onAction(record.uid, 'delete')}
                  >
                    删除
                  </Button>
                </>
              )}
            />
          </Table>

          <div className="mt-[20px] flex justify-end">
            <PaginationComponent />
          </div>
        </Card>
      </ContentLayout>

      <Modal
        centered
        onCancel={() => setShowCreateModal(false)}
        open={showCreateModal}
        title="新建数据集"
        width={830}
        footer={null}
      >
        <Form<Dataset.InputCreateParams>
          className="mt-[36px]"
          form={form}
          name="new-task-form"
          onFinish={onFinish}
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
            <Select options={datasetTypeOptions} placeholder="选择数据集类型" />
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

          <Form.Item label="过滤器">
            <Form.List name="filter">
              {(logicFields, { add: addLogic, remove: removeLogic }) => (
                <>
                  {logicFields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      className="mb-[12px]"
                      styles={{ body: { paddingBottom: 0 } }}
                    >
                      <Flex gap={16}>
                        <Form.Item
                          {...restField}
                          name={[name, 'logic']}
                          label="逻辑关系"
                          className="flex-1"
                        >
                          <Select
                            placeholder="请选择逻辑关系"
                            options={datasetFilterLogicOptions}
                          />
                        </Form.Item>

                        <Button
                          danger
                          onClick={() => removeLogic(name)}
                          icon={<i className="i-line-md:trash text-[20px]" />}
                        >
                          删除过滤器
                        </Button>
                      </Flex>

                      <Form.Item>
                        <Form.List name={[name, 'group']}>
                          {(
                            groupFields,
                            { add: addGroup, remove: removeGroup },
                          ) => (
                            <>
                              {groupFields.map(
                                ({ key, name, ...restField }) => (
                                  <Card
                                    key={key}
                                    className="mb-[12px]"
                                    styles={{ body: { paddingBottom: 0 } }}
                                  >
                                    <Flex gap={16}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'table']}
                                        className="flex-1"
                                        label="条件组数据表"
                                      >
                                        <Select
                                          placeholder="请选择表"
                                          options={datasetFilterTableOptions}
                                        />
                                      </Form.Item>

                                      <Button
                                        danger
                                        onClick={() => removeGroup(name)}
                                        icon={
                                          <i className="i-line-md:trash text-[20px]" />
                                        }
                                      >
                                        删除条件组
                                      </Button>
                                    </Flex>

                                    <Form.Item>
                                      <Form.List name={[name, 'conditions']}>
                                        {(
                                          conditionFields,
                                          {
                                            add: addCondition,
                                            remove: removeCondition,
                                          },
                                        ) => (
                                          <>
                                            {conditionFields.map(
                                              ({ key, name, ...restField }) => (
                                                <Flex
                                                  key={key}
                                                  className="w-full"
                                                  gap={8}
                                                >
                                                  <Form.Item
                                                    {...restField}
                                                    name={[name, 'column']}
                                                    className="basis-[188px]"
                                                  >
                                                    <Input placeholder="输入字段名称" />
                                                  </Form.Item>

                                                  <Form.Item
                                                    {...restField}
                                                    name={[name, 'operator']}
                                                    className="basis-[100px]"
                                                  >
                                                    <Select
                                                      options={
                                                        datasetFilterOperatorOptions
                                                      }
                                                      placeholder="选择操作符"
                                                    />
                                                  </Form.Item>

                                                  <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    className="flex-1"
                                                  >
                                                    <Input placeholder="输入值" />
                                                  </Form.Item>

                                                  <Button
                                                    danger
                                                    type="link"
                                                    onClick={() =>
                                                      removeCondition(name)
                                                    }
                                                    className="basis-[32px]"
                                                    icon={
                                                      <i className="i-line-md:trash text-[20px]" />
                                                    }
                                                  />
                                                </Flex>
                                              ),
                                            )}

                                            <Button
                                              block
                                              type="dashed"
                                              onClick={addCondition}
                                              icon={
                                                <i className="i-line-md:plus-circle text-[20px]" />
                                              }
                                            >
                                              添加条件
                                            </Button>
                                          </>
                                        )}
                                      </Form.List>
                                    </Form.Item>
                                  </Card>
                                ),
                              )}

                              <Button
                                block
                                type="dashed"
                                onClick={addGroup}
                                icon={
                                  <i className="i-line-md:plus-circle text-[20px]" />
                                }
                              >
                                添加条件组
                              </Button>
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                    </Card>
                  ))}

                  <Button
                    block
                    type="dashed"
                    onClick={addLogic}
                    icon={
                      <i className="i-line-md:plus-circle text-[20px] fg-secondary" />
                    }
                  >
                    添加过滤器
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

export default DatasetListPage;
