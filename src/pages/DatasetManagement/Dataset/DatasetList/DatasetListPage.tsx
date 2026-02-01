import { App, Button, Card, Form, Table } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { CreateDatasetModal } from '@/pages/DatasetManagement/components/CreateDatasetModal';
import { datasetFilterDB2FE } from '@/pages/DatasetManagement/helper';
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

  // 复制数据集
  const [form] = Form.useForm<Dataset.InputCreateParams>();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const newDatasetData = useRef<Dataset.InputCreateParams | null>(null);
  const onCopy = (record: Dataset.Item) => {
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
    setShowCopyModal(true);
  };

  // 数据集操作
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

  return (
    <>
      <CreateDatasetModal
        form={form}
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onFinish={() => refresh()}
      />

      <ContentLayout title="数据集列表">
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
    </>
  );
};

export default DatasetListPage;
