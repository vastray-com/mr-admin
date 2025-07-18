import { Button, Card, Descriptions, Drawer, Table } from 'antd';
import { useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { taskInstanceStatusDisplay } from '@/pages/TasksManagement/TaskList/TaskDetail/TaskDetailPage';

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

  const { taskApi } = useApi();

  if (!taskId || !instanceId) {
    return null;
  }

  if (!isInitial.current) {
    const promiseList = [
      taskApi.getTaskInstanceDetail(Number(instanceId)),
      taskApi.getTaskInstanceResultList(Number(taskId)),
    ];
    Promise.all(promiseList)
      .then((result) => {
        const [detailRes, resultRes] = result as [
          APIRes<Task.Instance>,
          APIRes<Task.ResultList>,
        ];
        if (detailRes.code === 200) setData(detailRes.data);
        if (resultRes.code === 200) setResultList(resultRes.data);
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
            { key: '3', label: '开始执行时间', children: data.task_start_time },
            { key: '4', label: '执行时长', children: data.task_duration },
            { key: '5', label: '总量', children: data.task_duration },
            { key: '6', label: '任务结果', children: data.task_duration },
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
        <Table<Task.ResultListItem> dataSource={resultList} rowKey="id">
          <Table.Column title="记录 ID" dataIndex="id" />
          <Table.Column title="输入数据" dataIndex="input_summary" />
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
      </Card>

      <Drawer
        title="结果查看"
        width="88%"
        closable={{ 'aria-label': 'Close Button' }}
        open={drawer.open}
        onClose={() => setDrawer({ open: false, data: null })}
      >
        <div className="flex items-center gap-x-[16px] h-full">
          <Card title="输入数据" className="w-full h-full">
            <div className="overflow-auto pos-relative">
              {drawer.data?.input || '暂无输入数据'}
            </div>
          </Card>
          <Card title="生成数据" className="w-full h-full">
            <p className="h-full overflow-auto whitespace-pre-wrap">
              {JSON.stringify(
                JSON.parse(drawer.data?.output ?? '{}'),
                null,
                4,
              ) || '暂无生成数据'}
            </p>
          </Card>
        </div>
      </Drawer>
    </ContentLayout>
  );
};

export default InstanceDetailPage;
