import { Button, Card, Descriptions, Drawer, Pagination, Table } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ScrollableCard } from '@/components/Card';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { taskInstanceStatusDisplay } from '@/pages/TasksManagement/TaskList/TaskDetail/TaskDetailPage';
import { formatCountToString } from '@/utils/helper';

const InstanceDetailPage = () => {
  const { taskId, instanceId } = useParams();

  // 详情弹窗
  const [drawer, setDrawer] = useState<{
    open: boolean;
    data: Task.ResultDetail | null;
  }>({
    open: false,
    data: null,
  });

  const isInitial = useRef(false);
  const [data, setData] = useState<Task.Instance | null>(null);
  const [resultList, setResultList] = useState<Task.ResultList>([]);
  const [pagination, setPagination] = useState<{ cur: number; size: number }>({
    cur: 1,
    size: 10,
  });
  const currentList = useMemo(() => {
    return resultList.slice(
      (pagination.cur - 1) * pagination.size,
      pagination.cur * pagination.size,
    );
  }, [pagination, resultList]);

  const { taskApi } = useApi();

  if (!taskId || !instanceId) {
    return null;
  }

  if (!isInitial.current) {
    const promiseList = [
      taskApi.getTaskInstanceDetail(Number(instanceId)),
      taskApi.getTaskInstanceResultList(Number(instanceId)),
    ];
    Promise.all(promiseList)
      .then((result) => {
        const [detailRes, resultRes] = result as [
          APIRes<Task.Instance>,
          APIRes<Task.ResultList>,
        ];
        if (detailRes.code === 200) setData(detailRes.data);
        if (resultRes.code === 200) {
          setResultList(resultRes.data);
        }
      })
      .catch((e) => {
        console.error('获取实例详情失败：', e);
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
      title="执行结果"
      breadcrumb={[
        { title: '任务列表' },
        { title: '任务详情' },
        { title: '执行结果' },
      ]}
    >
      <Card title="执行信息">
        <Descriptions
          column={2}
          items={[
            { key: '1', label: '记录 ID', children: data.id },
            {
              key: '2',
              label: '运行状态',
              children: taskInstanceStatusDisplay[data.status][1],
            },
            {
              key: '3',
              label: '开始执行时间',
              children: dayjs(data.task_start_time).format(
                'YYYY-MM-DD HH:mm:ss',
              ),
            },
            { key: '4', label: '执行时长', children: data.task_duration },
            {
              key: '5',
              label: '总量',
              children: formatCountToString(data.mr_total),
            },
            {
              key: '6',
              label: '任务结果',
              children: (
                <p>
                  <span>{`已执行${formatCountToString(data.mr_finish + data.mr_fail)}`}</span>
                  <span>{`，成功 ${formatCountToString(data.mr_finish)}`}</span>
                  <span>{`，失败 `}</span>
                  <span className="text-red">{`${formatCountToString(data.mr_fail)}`}</span>
                </p>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title={
          <>
            <span>结果预览</span>
            <span className="text-fg-tertiary text-[14px] font-normal">
              （仅前100条数据）
            </span>
          </>
        }
        className="mt-[16px]"
      >
        <Table<Task.ResultListItem>
          dataSource={currentList}
          rowKey="id"
          pagination={false}
        >
          <Table.Column title="记录 ID" dataIndex="id" />
          <Table.Column title="输入数据" dataIndex="input_summary" />
          <Table.Column
            title="生成时间"
            dataIndex="create_time"
            render={(time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Table.Column
            title="操作"
            key="action"
            render={(_, record: Task.ResultListItem) => (
              <>
                <Button
                  type="link"
                  onClick={async () => {
                    console.log(`查看详情: ${record.id}`);
                    const detail = await taskApi.getTaskInstanceResultDetail(
                      Number(instanceId),
                      record.op_em_no,
                    );
                    setDrawer({ open: true, data: detail.data });
                  }}
                >
                  查看
                </Button>
              </>
            )}
          />
        </Table>

        <div className="mt-[20px] flex justify-end">
          <Pagination
            showTotal={(total) => `共 ${total} 条`}
            showSizeChanger
            current={pagination.cur}
            pageSize={pagination.size}
            onChange={(cur, size) => setPagination({ cur, size })}
            total={resultList.length}
          />
        </div>
      </Card>

      <Drawer
        title="结果查看"
        width="88%"
        closable={{ 'aria-label': 'Close Button' }}
        open={drawer.open}
        onClose={() => setDrawer({ open: false, data: null })}
      >
        <div className="flex items-center gap-x-[16px] h-full">
          <ScrollableCard title="输入数据">
            <p className=" whitespace-pre-wrap">
              {drawer.data?.input || '暂无输入数据'}
            </p>
          </ScrollableCard>

          <ScrollableCard title="生成数据">
            <p className="whitespace-pre-wrap">
              {drawer.data?.output
                ? JSON.stringify(JSON.parse(drawer.data?.output ?? ''), null, 4)
                : '暂无生成数据'}
            </p>
          </ScrollableCard>
        </div>
      </Drawer>
    </ContentLayout>
  );
};

export default InstanceDetailPage;
