import { App, Button, Card, Descriptions, Divider, Table } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { useCacheStore } from '@/store/useCacheStore';
import { taskTypeMap } from '@/typing/enum';
import { formatCountToString, formatSecondsToTime } from '@/utils/helper';
import type { Task } from '@/typing/task';

export const taskInstanceStatusDisplay: Record<
  Task.Instance['status'],
  [string, string]
> = {
  0: ['#FAAD14', '待运行'],
  1: ['#52C41A', '运行中'],
  2: ['#F5222D', '运行完成'],
  3: ['#FAAD14', '运行失败'],
};

const TaskDetailPage = () => {
  const { taskUid } = useParams();
  const { taskApi } = useApi();
  const { message } = App.useApp();

  const isInitial = useRef(false);
  const ruleOptions = useCacheStore((s) => s.ruleOptions);

  const [data, setData] = useState<Task.Item | null>(null);

  // 拉取列表分页数据
  const [instanceList, setInstanceList] = useState<Task.InstanceList>([]);
  const fetchInstanceList = useCallback(
    async (params: PaginationParams) => {
      return taskUid
        ? taskApi.getTaskInstanceList({
            ...params,
            task_uid: taskUid,
          })
        : Promise.reject('任务 ID 不存在');
    },
    [taskUid, taskApi.getTaskInstanceList],
  );
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: fetchInstanceList,
    setData: setInstanceList,
  });

  // 停止任务实例
  const stopInstance = useCallback(
    (instanceUid: string) => {
      taskApi
        .stopTaskInstance({ task_instance_uid: instanceUid })
        .then((res) => {
          if (res.code === 200) {
            refresh();
            message.success('停止任务执行成功');
          } else {
            message.error(`停止任务执行失败：${res.msg}`);
          }
        })
        .catch((e) => {
          console.error('停止任务实例失败：', e);
          message.error(`${e.response.data?.message ?? e.message}`);
        });
    },
    [taskApi, refresh, message],
  );

  if (!taskUid) return null;
  if (!isInitial.current) {
    isInitial.current = true;
    taskApi
      .getTaskDetail({ task_uid: taskUid })
      .then((res) => {
        if (res.code === 200) setData(res.data);
      })
      .catch((e) => console.error('获取任务详情失败：', e));
    return null;
  }
  if (!data) return null;

  return (
    <ContentLayout
      title="任务详情"
      breadcrumb={[
        { title: <Link to="/tasks_management/tasks">任务列表</Link> },
        { title: '任务详情' },
      ]}
    >
      <Card title="基本信息">
        <Descriptions
          column={2}
          items={[
            {
              key: '1',
              label: '任务类型',
              children: taskTypeMap[data.task_type],
            },
            {
              key: '2',
              label: '结构化规则',
              children:
                ruleOptions.find((r) => r.value === data.rule_uid)?.label ||
                '-',
            },
            {
              key: '3',
              label: '输入源',
              children: '-',
            },
            { key: '4', label: '执行时间', children: data.cron },
          ]}
        />
      </Card>

      <Card title="执行记录" className="mt-[16px]">
        <Table<Task.Instance>
          dataSource={instanceList}
          rowKey="uid"
          pagination={false}
        >
          <Table.Column title="记录 ID" dataIndex="uid" />
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
            render={(_, record: Task.Instance) => (
              <>
                <Link
                  to={`/tasks_management/tasks/detail/${taskUid}/${record.uid}`}
                >
                  <Button type="link">下载</Button>
                </Link>
                <Divider type="vertical" />
                <Link
                  to={`/tasks_management/tasks/detail/${taskUid}/${record.uid}`}
                >
                  <Button type="link">查看结果</Button>
                </Link>
                {record.status === 1 && (
                  <Button
                    type="link"
                    danger
                    onClick={() => stopInstance(record.uid)}
                  >
                    停止执行
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

export default TaskDetailPage;
