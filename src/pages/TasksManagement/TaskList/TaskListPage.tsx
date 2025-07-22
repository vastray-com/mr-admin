import { Button, Card, Table } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { TaskType } from '@/typing/enum';

const statusDisplay: Record<Task.Item['status'], [string, string]> = {
  0: ['#D9D9D9', '已停用'],
  1: ['#52C41A', '已启用'],
};

const TaskListPage = () => {
  const isInitial = useRef(false);
  const [data, setData] = useState<Task.List>([]);
  const { taskApi } = useApi();

  if (!isInitial.current) {
    taskApi
      .getTaskList({
        page_num: 1,
        page_size: 200,
      })
      .then((res) => {
        if (res.code === 200) {
          setData(res.data.data);
        }
      })
      .catch((err) => console.error('获取任务列表失败：', err))
      .finally(() => {
        isInitial.current = true;
      });
    return null;
  }

  return (
    <ContentLayout title="任务列表">
      <Card>
        <Table<Task.Item> dataSource={data} rowKey="id">
          <Table.Column title="任务编号" dataIndex="id" />
          <Table.Column
            title="任务类型"
            dataIndex="task_type"
            render={(type: Task.Item['task_type']) => TaskType[type]}
          />
          <Table.Column title="结构化规则" dataIndex="mr_tpl_id" />
          <Table.Column
            title="创建时间"
            dataIndex="create_time"
            render={(time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Table.Column
            title="执行任务数"
            dataIndex="execute_count"
            render={(count: number) => count ?? '-'}
          />
          <Table.Column
            title="状态"
            dataIndex="status"
            render={(status: Task.Item['status']) => {
              return (
                <p className="flex gap-x-[6px] items-center">
                  <span
                    style={{ background: statusDisplay[status][0] }}
                    className={clsx('w-[6px] h-[6px] rounded-full')}
                  />
                  <span>{statusDisplay[status][1]}</span>
                </p>
              );
            }}
          />
          <Table.Column
            title="操作"
            key="action"
            render={(_, record: Task.Item) => (
              <Button
                type="link"
                href={`/tasks_management/tasks/detail/${record.id}`}
              >
                详情
              </Button>
            )}
          />
        </Table>
      </Card>
    </ContentLayout>
  );
};

export default TaskListPage;
