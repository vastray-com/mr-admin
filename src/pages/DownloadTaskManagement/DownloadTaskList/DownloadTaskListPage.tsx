import { App, Button, Card, Popconfirm, Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { ENUM_VARS } from '@/typing/enum';
import { DownloadTaskStatus } from '@/typing/enum/downloadTask';
import type { DownloadTask } from '@/typing/downloadTask';
import type { DatasetResourceType } from '@/typing/enum/dataset';

const DownloadTaskListPage = () => {
  const { downloadTaskApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<DownloadTask.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: downloadTaskApi.getDownloadTaskList,
    setData: setData,
  });

  const onUpdate = (record: DownloadTask.Item, status: DownloadTaskStatus) => {
    console.log(`下载申请 ${record} 要更新为状态 ${status}`);
    downloadTaskApi
      .updateDownloadTask({ uid: record.uid, status })
      .then((res) => {
        if (res.code === 200) {
          message.success('操作成功');
        } else {
          message.error(res.message || '操作失败，请稍后再试');
        }
      })
      .catch((e) => {
        message.error(e.message || '操作失败，请稍后再试');
      })
      .finally(() => {
        refresh();
      });
  };

  return (
    <ContentLayout title="我的审批">
      <Card>
        <Table<DownloadTask.Item>
          dataSource={data}
          rowKey="uid"
          pagination={false}
          onRow={(_, i) => ({
            className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
          })}
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
            title="数据范围/质控模版"
            dataIndex="r"
            render={(_, record: DownloadTask.Item) => {
              const t = record.template_name;
              const rl = record.resource_list as
                | DatasetResourceType[]
                | undefined;
              if (t) {
                return (
                  <Tooltip placement="top" title={t}>
                    {`质控: ${t}`}
                  </Tooltip>
                );
              }
              if (rl && rl.length > 0) {
                return rl.length > 1 ? (
                  <Tooltip
                    placement="top"
                    title={rl
                      .map((r) => ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[r])
                      .join(', ')}
                  >
                    {`${ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[rl[0]]}等${rl.length}项`}
                  </Tooltip>
                ) : (
                  ENUM_VARS.DATASET.RESOURCE_TYPE_MAP[rl[0]]
                );
              }
            }}
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
          <Table.Column title="申请人" dataIndex="applicant_name" />
          <Table.Column
            title="申请时间"
            dataIndex="created_at"
            width={240}
            render={(v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Table.Column
            title="操作"
            key="action"
            width={240}
            render={(_, record: DownloadTask.Item) => (
              <>
                {record.status === DownloadTaskStatus.PendingApproval && (
                  <>
                    <Button
                      type="link"
                      onClick={() =>
                        onUpdate(record, DownloadTaskStatus.Approved)
                      }
                    >
                      批准
                    </Button>
                    <Popconfirm
                      title="拒绝下载申请"
                      description="确定要拒绝该下载申请吗？"
                      onConfirm={() =>
                        onUpdate(record, DownloadTaskStatus.Declined)
                      }
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger>
                        拒绝
                      </Button>
                    </Popconfirm>
                  </>
                )}{' '}
                {record.status === DownloadTaskStatus.Failed && (
                  <Button
                    type="link"
                    onClick={() =>
                      onUpdate(record, DownloadTaskStatus.Approved)
                    }
                  >
                    重新导出
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

export default DownloadTaskListPage;
