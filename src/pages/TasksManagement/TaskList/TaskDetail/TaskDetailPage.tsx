import { Button, Card, Descriptions, Divider, Table } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { TaskType } from '@/typing/enum';
import { formatCountToString, formatSecondsToTime } from '@/utils/helper';

export const taskInstanceStatusDisplay: Record<
  Task.Instance['status'],
  [string, string]
> = {
  0: ['#FAAD14', '运行中'],
  1: ['#52C41A', '运行完成'],
  2: ['#F5222D', '运行失败'],
};

const TaskDetailPage = () => {
  const { taskId } = useParams();

  const isInitial = useRef(false);
  const [data, setData] = useState<Task.Item | null>(null);
  const [instanceList, setInstanceList] = useState<Task.InstanceList>([]);

  const { taskApi } = useApi();

  if (!taskId) {
    return null;
  }

  if (!isInitial.current) {
    const promiseList = [
      taskApi.getTaskDetail({ task_id: Number(taskId) }),
      taskApi.getTaskInstanceList({
        task_id: Number(taskId),
        page_num: 1,
        page_size: 200,
      }),
    ];
    Promise.all(promiseList)
      .then((result) => {
        const [detailRes, instancesRes] = result as [
          APIRes<Task.Item>,
          APIRes<PaginationData<Task.Instance>>,
        ];
        if (detailRes.code === 200) setData(detailRes.data);
        if (instancesRes.code === 200) setInstanceList(instancesRes.data.data);
      })
      .catch((e) => {
        console.error('获取任务详情失败：', e);
      })
      .finally(() => {
        isInitial.current = true;
      });
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <ContentLayout
      title="任务详情"
      breadcrumb={[{ title: '任务列表' }, { title: '任务详情' }]}
    >
      <Card title="基本信息">
        <Descriptions
          column={2}
          items={[
            { key: '1', label: '任务类型', children: TaskType[data.task_type] },
            { key: '2', label: '结构化规则', children: data.mr_tpl_id },
            {
              key: '3',
              label: '输入源',
              children: JSON.parse(data.category_list).join('，'),
            },
            { key: '4', label: '执行时间', children: data.cron },
          ]}
        />
      </Card>

      <Card title="执行记录" className="mt-[16px]">
        <Table<Task.Instance> dataSource={instanceList} rowKey="id">
          <Table.Column title="记录 ID" dataIndex="id" />
          <Table.Column
            title="运行状态"
            dataIndex="status"
            render={(status: Task.Instance['status']) => {
              return (
                <p className="flex gap-x-[6px] items-center">
                  <span
                    style={{ background: taskInstanceStatusDisplay[status][0] }}
                    className={clsx('w-[6px] h-[6px] rounded-full')}
                  />
                  <span>{taskInstanceStatusDisplay[status][1]}</span>
                </p>
              );
            }}
          />
          <Table.Column
            title="开始执行时间"
            dataIndex="task_start_time"
            render={(time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Table.Column
            title="执行时长"
            dataIndex="task_duration"
            render={(duration: number) => formatSecondsToTime(duration)}
          />
          <Table.Column
            title="总文书量"
            dataIndex="mr_total"
            render={(total: number) => formatCountToString(total)}
          />
          <Table.Column
            title="任务结果（已执行/成功/失败）"
            dataIndex="result"
            render={(_, record: Task.Instance) => (
              <p className="flex gap-x-[2px] items-center">
                <span>
                  {formatCountToString(record.mr_finish + record.mr_fail)}
                </span>
                <span className="opacity-48">/</span>
                <span>{formatCountToString(record.mr_finish)}</span>
                <span className="opacity-48">/</span>
                <span className="text-red">
                  {formatCountToString(record.mr_fail)}
                </span>
              </p>
            )}
          />

          <Table.Column
            title="操作"
            key="action"
            render={(_, record: Task.Item) => (
              <>
                <Button
                  type="link"
                  href={`/tasks_management/tasks/detail/${record.id}`}
                >
                  下载
                </Button>
                <Divider type="vertical" />
                <Button
                  type="link"
                  href={`/tasks_management/tasks/detail/${taskId}/${record.id}`}
                >
                  查看结果
                </Button>
              </>
            )}
          />
        </Table>
      </Card>
    </ContentLayout>
  );
};

export default TaskDetailPage;
