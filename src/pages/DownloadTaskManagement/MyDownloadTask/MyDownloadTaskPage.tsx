import { App, Button, Card, Table, Tag } from 'antd';
import { useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { ENUM_VARS } from '@/typing/enum';
import { DownloadTaskStatus } from '@/typing/enum/downloadTask';
import type { DownloadTask } from '@/typing/downloadTask';

const MyDownloadTaskPage = () => {
  const { downloadTaskApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<DownloadTask.List>([]);
  const { PaginationComponent } = usePaginationData({
    fetchData: downloadTaskApi.getDownloadTaskList,
    setData: setData,
  });

  const onDownload = (record: DownloadTask.Item) => {
    console.log(`下载申请单：${record.uid}，数据集 ID：${record.dataset_uid}`);
    message.success('下载成功');
  };

  return (
    <ContentLayout title="我的下载">
      <Card>
        <Table<DownloadTask.Item>
          dataSource={data}
          rowKey="uid"
          pagination={false}
        >
          <Table.Column title="申请单 ID" dataIndex="uid" />
          <Table.Column
            title="数据集 ID"
            dataIndex="dataset_uid"
            render={(uid: string) => (
              <Button
                type="link"
                target="_blank"
                href={`/data/dataset/detail/${uid}`}
                className="p-0 m-0"
              >
                {uid}
              </Button>
            )}
          />
          <Table.Column
            title="状态"
            dataIndex="status"
            render={(s: DownloadTaskStatus) => {
              let color: string | undefined;
              switch (s) {
                case DownloadTaskStatus.Approved:
                case DownloadTaskStatus.Exporting:
                  color = 'blue';
                  break;
                case DownloadTaskStatus.Finished:
                  color = 'green';
                  break;
                case DownloadTaskStatus.Declined:
                case DownloadTaskStatus.Failed:
                  color = 'red';
                  break;
                case DownloadTaskStatus.PendingApproval:
                  break;
              }
              return (
                <Tag color={color}>{ENUM_VARS.DOWNLOAD_TASK.STATUS_MAP[s]}</Tag>
              );
            }}
          />
          <Table.Column title="审批人" dataIndex="examiner_uid" />
          <Table.Column
            title="操作"
            key="action"
            width={280}
            render={(_, record: DownloadTask.Item) => (
              <>
                {record.status === DownloadTaskStatus.Finished && (
                  <Button type="link" onClick={() => onDownload(record)}>
                    下载
                  </Button>
                )}
              </>
            )}
          />
        </Table>

        <div className="mt-[20px] flex justify-end">
          <PaginationComponent />
        </div>
      </Card>
    </ContentLayout>
  );
};

export default MyDownloadTaskPage;
