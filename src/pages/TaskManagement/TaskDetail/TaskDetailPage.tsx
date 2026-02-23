import { App, Button, Card, Descriptions, Divider, Table } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { ENUM_VARS } from '@/typing/enum';
import {
  OneTimeTaskType,
  TaskInstanceStatus,
  TaskType,
} from '@/typing/enum/task';
import { formatCountToString, formatSecondsToTime } from '@/utils/helper';
import type { Task } from '@/typing/task';

const TaskDetailPage = () => {
  const { taskUid } = useParams();
  const { taskApi } = useApi();
  const { message } = App.useApp();

  const isInitial = useRef(false);
  // const ruleOptions = useCacheStore((s) => s.structuredRulesetOptions);
  // const pushRuleList = useCacheStore((s) => s.pushRuleList);

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
            message.error(`停止任务执行失败：${res.message}`);
          }
        })
        .catch((e) => {
          console.error('停止任务实例失败：', e);
          message.error(`${e.response.data?.message ?? e.message}`);
        });
    },
    [taskApi, refresh, message],
  );

  // 重新执行推送
  // const rePushTaskInstance = useCallback(
  //   async (params: Task.RePushParams) => {
  //     console.log('重新执行推送参数：', params);
  //     try {
  //       const res = await taskApi.taskInstanceRePush(params);
  //       console.log('重新执行推送结果：', res);
  //       if (res.code !== 200) {
  //         message.error(`重新执行推送失败：${res.message}`);
  //         return;
  //       }
  //       message.success('重新执行推送成功，请稍后查看结果');
  //       // 刷新列表
  //       refresh();
  //     } catch (e) {
  //       console.error('重新执行推送失败：', e);
  //       message.error('重新执行推送失败，请稍后重试');
  //     }
  //   },
  //   [message, refresh, taskApi],
  // );

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
        { title: <Link to="/task_management/list">任务列表</Link> },
        { title: '任务详情' },
      ]}
    >
      <Card title="基本信息">
        <Descriptions
          bordered
          column={3}
          items={[
            {
              key: 'name',
              label: '任务名称',
              children: data.dataset_name,
            },
            {
              key: 'uid',
              label: '任务 ID',
              children: data.uid,
            },
            {
              key: 'task_type',
              label: '任务类型',
              children: ENUM_VARS.TASK.TYPE_MAP[data.task_type],
            },
            {
              key: 'dataset_name',
              label: '关联数据集',
              children: data.dataset_name,
            },
            {
              key: 'status',
              label: '任务状态',
              children: data.status ? (
                <p className="flex gap-x-[6px] items-center">
                  <span
                    style={{
                      background: ENUM_VARS.TASK.STATUS_DISPLAY[data.status][0],
                    }}
                    className={clsx('w-[6px] h-[6px] rounded-full')}
                  />
                  <span>{ENUM_VARS.TASK.STATUS_DISPLAY[data.status][1]}</span>
                </p>
              ) : (
                '-'
              ),
            },
            {
              key: 'created_at',
              label: '任务创建时间',
              children: dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
              key: 'cron',
              label: '执行时间',
              children:
                data.task_type !== TaskType.Circular &&
                data.one_time_task_type === OneTimeTaskType.Immediate
                  ? '立即执行'
                  : data.cron,
              span: 3,
            },
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
                    style={{
                      background:
                        ENUM_VARS.TASK.INSTANCE_STATUS_DISPLAY[status][0],
                    }}
                    className={clsx('w-[6px] h-[6px] rounded-full')}
                  />
                  <span>
                    {ENUM_VARS.TASK.INSTANCE_STATUS_DISPLAY[status][1]}
                  </span>
                </p>
              );
            }}
          />
          <Table.Column
            title="开始执行时间"
            dataIndex="start_time"
            render={(time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
          />
          <Table.Column
            title="执行时长"
            dataIndex="duration"
            render={(duration: number) => formatSecondsToTime(duration)}
          />
          <Table.Column
            title="总文书量"
            dataIndex="total_count"
            render={(total: number) => formatCountToString(total)}
          />
          <Table.Column
            title="任务结果（已执行/成功/失败）"
            dataIndex="result"
            render={(_, record: Task.Instance) => (
              <p className="flex gap-x-[2px] items-center">
                <span>{formatCountToString(record.total_count)}</span>
                <span className="opacity-48">/</span>
                <span>{formatCountToString(record.succeed_count)}</span>
                <span className="opacity-48">/</span>
                <span className="text-red">
                  {formatCountToString(record.failed_count)}
                </span>
              </p>
            )}
          />

          {/*<Table.Column*/}
          {/*  title="推送结果"*/}
          {/*  dataIndex="push"*/}
          {/*  render={(_, record: Task.Instance) =>*/}
          {/*    record.push_status && record.push_status.length > 0 ? (*/}
          {/*      <Popover*/}
          {/*        content={record.push_status?.map((s) => {*/}
          {/*          const rule = pushRuleList.find(*/}
          {/*            (r) => r.uid === s.push_rule_uid,*/}
          {/*          );*/}
          {/*          const ruleName = rule ? rule.name_cn : '未知规则';*/}
          {/*          const statusText =*/}
          {/*            s.status === TaskPushStatus.Pending*/}
          {/*              ? '待运行'*/}
          {/*              : s.status === TaskPushStatus.Running*/}
          {/*                ? '运行中'*/}
          {/*                : s.status === TaskPushStatus.Completed*/}
          {/*                  ? '完成'*/}
          {/*                  : s.status === TaskPushStatus.Failed*/}
          {/*                    ? '失败'*/}
          {/*                    : '未知状态';*/}
          {/*          return (*/}
          {/*            <div key={s.push_time} className="mb-[16px]">*/}
          {/*              <p>*/}
          {/*                <span className="font-medium">{ruleName}</span>*/}
          {/*                <span className="mx-[4px]">-</span>*/}
          {/*                <span>{statusText}</span>*/}
          {/*                {(s.status === TaskPushStatus.Failed ||*/}
          {/*                  s.status === TaskPushStatus.Completed) && (*/}
          {/*                  <Button*/}
          {/*                    className="ml-[8px]"*/}
          {/*                    type="link"*/}
          {/*                    onClick={() => {*/}
          {/*                      rePushTaskInstance({*/}
          {/*                        task_instance_uid: record.uid,*/}
          {/*                        push_rule_uid: s.push_rule_uid,*/}
          {/*                      });*/}
          {/*                    }}*/}
          {/*                  >*/}
          {/*                    重新执行*/}
          {/*                  </Button>*/}
          {/*                )}*/}
          {/*              </p>*/}
          {/*              <p className="fg-tertiary">*/}
          {/*                <span>推送时间:</span>*/}
          {/*                <span>*/}
          {/*                  {s.push_time*/}
          {/*                    ? dayjs(s.push_time).format('YYYY-MM-DD HH:mm:ss')*/}
          {/*                    : '-'}*/}
          {/*                </span>*/}
          {/*              </p>*/}
          {/*            </div>*/}
          {/*          );*/}
          {/*        })}*/}
          {/*      >*/}
          {/*        <Button type="link">查看</Button>*/}
          {/*      </Popover>*/}
          {/*    ) : (*/}
          {/*      <span>未配置推送</span>*/}
          {/*    )*/}
          {/*  }*/}
          {/*/>*/}

          <Table.Column
            title="操作"
            key="action"
            render={(_, record: Task.Instance) => (
              <>
                {record.status === TaskInstanceStatus.Completed && (
                  <>
                    <Link
                      to={`/task_management/detail/${taskUid}/${record.uid}`}
                    >
                      <Button type="link">下载</Button>
                    </Link>
                    <Divider orientation="vertical" />
                    <Link
                      to={`/task_management/detail/${taskUid}/${record.uid}`}
                    >
                      <Button type="link">查看结果</Button>
                    </Link>
                  </>
                )}

                {record.status === TaskInstanceStatus.Running && (
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
