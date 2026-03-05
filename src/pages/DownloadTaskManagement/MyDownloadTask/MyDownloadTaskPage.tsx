import { App, Button, Card, Table, Tag, Tooltip } from 'antd';
import { useCallback, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { ENUM_VARS } from '@/typing/enum';
import { DownloadTaskStatus } from '@/typing/enum/downloadTask';
import { downloadFile } from '@/utils/helper';
import type { DownloadTask } from '@/typing/downloadTask';
import type { DatasetResourceType } from '@/typing/enum/dataset';

const MyDownloadTaskPage = () => {
  const { downloadTaskApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<DownloadTask.List>([]);
  const { PaginationComponent } = usePaginationData({
    fetchData: downloadTaskApi.getDownloadTaskList,
    setData: setData,
  });

  const onDownload = useCallback(async (record: DownloadTask.Item) => {
    console.log(`下载申请单：${record.uid}，数据集 ID：${record.dataset_uid}`);
    try {
      const res = await downloadTaskApi.downloadData({ uid: record.uid });
      downloadFile(res);
      message.success('下载成功');
    } catch (e) {
      message.error('下载失败');
      console.error('下载失败:', e);
    }
  }, []);

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
            title="数据集"
            dataIndex="dataset_name"
            render={(name: string, record: DownloadTask.Item) => (
              <Button
                type="link"
                target="_blank"
                href={`/data/dataset/detail/${record.dataset_uid}`}
                className="p-0 m-0"
              >
                {name}
              </Button>
            )}
          />
          <Table.Column
            title="数据范围"
            dataIndex="resource_list"
            render={(list: DatasetResourceType[]) =>
              list.length > 1 ? (
                <Tooltip
                  placement="top"
                  title={list
                    .map((r) => ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[r])
                    .join(', ')}
                >
                  {`${ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[list[0]]}等${list.length}项`}
                </Tooltip>
              ) : (
                ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[list[0]]
              )
            }
          />
          <Table.Column
            title="时间范围"
            dataIndex="date_range"
            render={(_, record: DownloadTask.Item) =>
              record.from_date && record.to_date
                ? `${record.from_date} ~ ${record.to_date}`
                : '-'
            }
          />
          <Table.Column
            title="状态"
            dataIndex="status"
            render={(s: DownloadTaskStatus, record: DownloadTask.Item) => {
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
              return record.failed_reason ? (
                <Tooltip placement="top" title={record.failed_reason}>
                  <Tag color={color}>
                    {ENUM_VARS.DOWNLOAD_TASK.STATUS_MAP[s]}
                  </Tag>
                </Tooltip>
              ) : (
                <Tag color={color}>{ENUM_VARS.DOWNLOAD_TASK.STATUS_MAP[s]}</Tag>
              );
            }}
          />
          <Table.Column title="审批人" dataIndex="examiner_name" />
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
