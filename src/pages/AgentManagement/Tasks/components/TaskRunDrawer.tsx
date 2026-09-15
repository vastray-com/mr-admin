import { App, Button, Drawer, Empty, Modal, Table, Tag } from 'antd';
import { type FC, useCallback, useEffect, useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { useApi } from '@/hooks/useApi';
import {
  formatTime,
  getApiErrorMessage,
  TASK_RUN_STATUS_MAP,
  TASK_TRIGGER_MAP,
} from '@/pages/AgentManagement/helper';
import type { TableProps } from 'antd';
import type { Agent } from '@/typing/agent';

type Props = {
  /** 目标任务（未选中时抽屉不请求数据） */
  task?: Agent.Task;
  open: boolean;
  onClose: () => void;
};

/** 定时任务执行记录抽屉：列表 + 结果详情，运行中自动轮询 */
export const TaskRunDrawer: FC<Props> = ({ task, open, onClose }) => {
  const { agentApi } = useApi();
  const { message } = App.useApp();

  const [runs, setRuns] = useState<Agent.TaskRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Agent.TaskRun>();

  const fetchRuns = useCallback(
    async (silent = false) => {
      if (!task) return;
      if (!silent) {
        setLoading(true);
      }
      try {
        const res = await agentApi.listTaskRuns(task.uid);
        if (res.code === 200) {
          setRuns(res.data);
        } else if (!silent) {
          message.error(res.message || '获取执行记录失败');
        }
      } catch (error) {
        if (!silent) {
          message.error(getApiErrorMessage(error, '获取执行记录失败'));
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [agentApi, task, message],
  );

  useEffect(() => {
    if (open && task) {
      void fetchRuns(false);
    } else {
      setRuns([]);
    }
  }, [open, task, fetchRuns]);

  // 存在运行中的记录时定时刷新
  const hasRunning = runs.some((run) => run.status === 'running');
  useEffect(() => {
    if (!open || !hasRunning) {
      return;
    }
    const timer = setInterval(() => {
      void fetchRuns(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [open, hasRunning, fetchRuns]);

  const columns: TableProps<Agent.TaskRun>['columns'] = [
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = TASK_RUN_STATUS_MAP[status];
        return <Tag color={config?.color}>{config?.text ?? status}</Tag>;
      },
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      width: 100,
      render: (trigger: string) => TASK_TRIGGER_MAP[trigger] ?? trigger,
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      width: 170,
      render: (value?: string | null) => formatTime(value),
    },
    {
      title: '结束时间',
      dataIndex: 'finished_at',
      width: 170,
      render: (value?: string | null) => formatTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => setDetail(record)}>
          查看结果
        </Button>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={task ? `执行记录 · ${task.name}` : '执行记录'}
        width={760}
        open={open}
        onClose={onClose}
        extra={<Button onClick={() => void fetchRuns(false)}>刷新</Button>}
      >
        <Table<Agent.TaskRun>
          rowKey="uid"
          size="small"
          loading={loading}
          dataSource={runs}
          columns={columns}
          pagination={false}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
        />
      </Drawer>

      <Modal
        centered
        open={!!detail}
        title="执行结果"
        width={760}
        footer={null}
        onCancel={() => setDetail(undefined)}
      >
        {detail?.status === 'failed' ? (
          <div className="rounded-[8px] bg-[#fff1f0] p-[12px] text-[13px] text-[#cf1322] whitespace-pre-wrap">
            {detail?.error || '执行失败'}
          </div>
        ) : detail?.output ? (
          <div className="max-h-[60vh] overflow-auto">
            <Markdown content={detail.output} />
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              detail?.status === 'running' ? '任务执行中…' : '暂无输出结果'
            }
          />
        )}
      </Modal>
    </>
  );
};
