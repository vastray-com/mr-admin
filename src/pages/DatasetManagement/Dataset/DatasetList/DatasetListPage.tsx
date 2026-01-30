import { App, Button, Card, Form, Input, Modal, Select, Table } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { DatasetFilterForm } from '@/pages/DatasetManagement/components/DatasetFilterForm';
import {
  datasetFilterDB2FE,
  datasetFilterFE2DB,
} from '@/pages/DatasetManagement/helper';
import { ENUM_VARS } from '@/typing/enum';
import type { Dataset } from '@/typing/dataset';
import type { DatasetSourceType, DatasetType } from '@/typing/enum/dataset';

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
      source_type: record.source_type,
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
      if (action === 'delete') {
        datasetApi
          .deleteDataset(uid)
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
      }
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

  // 数据集创建表单相关数据构造
  const sourceType = Form.useWatch('source_type', form);
  const sourceTypeRef = useRef<string | null>(null);
  // 当切换数据源类型时，重置 filter 字段
  useEffect(() => {
    sourceTypeRef.current = sourceType || null;
  }, [sourceType]);

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
              render={(type: DatasetType) => ENUM_VARS.DATASET.TYPE_MAP[type]}
            />
            <Table.Column
              title="数据源类型"
              dataIndex="source_type"
              render={(type: DatasetSourceType) =>
                ENUM_VARS.DATASET.SOURCE_TYPE_MAP[type]
              }
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
                  <Link to={`/data/dataset/detail/${record.uid}`}>
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
          name="new-dataset-form"
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
              onChange={(v) => {
                if (sourceTypeRef.current && sourceTypeRef.current !== v) {
                  form.setFieldsValue({ filter: [] });
                }
              }}
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
            form={form}
            sourceType={sourceType}
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
    </>
  );
};

export default DatasetListPage;
