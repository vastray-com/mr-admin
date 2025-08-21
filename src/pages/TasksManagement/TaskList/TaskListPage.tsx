import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useCacheStore } from '@/store/useCacheStore';
import {
  OneTimeTaskType,
  oneTimeTaskTypeOptions,
  TaskStatus,
  TaskType,
  taskTypeMap,
  taskTypeOptions,
} from '@/typing/enum';
import type { Task } from '@/typing/task';

const statusDisplay: Record<TaskStatus, [string, string]> = {
  0: ['#D9D9D9', '已停用'],
  1: ['#52C41A', '已启用'],
};

const TaskListPage = () => {
  const isInitial = useRef(false);
  const [data, setData] = useState<Task.List>([]);
  const { taskApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表
  const fetchList = useCallback(async () => {
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
  }, [taskApi]);

  // 新建任务
  const ruleList = useCacheStore((s) => s.structRuleList);
  const ruleOptions = useMemo(() => {
    return ruleList.map((rule) => ({
      value: rule.id,
      label: rule.name_cn,
    }));
  }, [ruleList]);
  const [form] = Form.useForm<Task.CreateItem>();
  const newTaskData = useRef<Task.CreateItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    form.resetFields();
    setShowCreateModal(true);
  };
  const onCopy = (record: Task.Item) => {
    form.resetFields();
    newTaskData.current = {
      ...record,
      schedule_time: dayjs(record.schedule_time),
      env_vars: Object.entries(JSON.parse(record.env_vars || '{}')),
    };
    console.log('复制的任务数据：', newTaskData.current);
    form.setFieldsValue(newTaskData.current);
    // 打开新建任务模态框
    setShowCreateModal(true);
  };

  const onAction = useCallback(
    (id: number, action: Task.ActionParams['action']) => {
      console.log(`执行操作：${action}，任务 ID：${id}`);
      taskApi
        .actionTask({ id, action })
        .then((res) => {
          if (res.code === 200) {
            message.success(`操作成功`);
            // 刷新任务列表
            fetchList();
          } else {
            message.error(`操作失败：${res.msg}`);
          }
        })
        .catch((err) => {
          console.error(`操作任务失败：`, err);
          message.error('操作任务失败，请稍后重试');
        });
    },
    [taskApi, fetchList, message.error, message.success],
  );

  const onFinish = useCallback(
    async (values: Task.CreateItem) => {
      console.log('提交的新任务数据：', values);
      const newTaskData: Task.Item = {
        ...values,
        schedule_time: values.schedule_time?.toISOString(),
        env_vars:
          values.env_vars?.length > 0
            ? JSON.stringify(Object.fromEntries(values.env_vars || []))
            : '{}',
      };
      console.log('转换后的新任务数据：', newTaskData);
      try {
        const res = await taskApi.createTask(newTaskData);
        if (res.code === 200) {
          message.success('任务创建成功');
          setShowCreateModal(false);
          form.resetFields();
          // 刷新任务列表
          await fetchList();
        } else {
          message.error(`创建任务失败：${res.msg}`);
        }
      } catch (error) {
        console.error('创建任务失败：', error);
        message.error('创建任务失败，请稍后重试');
      }
    },
    [taskApi, fetchList, form.resetFields, message.error, message.success],
  );

  if (!isInitial.current) {
    fetchList();
    return null;
  }

  return (
    <>
      <ContentLayout
        title="任务列表"
        action={
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建任务
          </Button>
        }
      >
        <Card>
          <Table<Task.Item> dataSource={data} rowKey="id">
            <Table.Column title="任务编号" dataIndex="id" />
            <Table.Column
              title="任务类型"
              dataIndex="task_type"
              render={(type: TaskType) => taskTypeMap[type]}
            />
            <Table.Column
              title="结构化规则"
              dataIndex="rule_id"
              render={(id) =>
                ruleOptions.find((rule) => rule.value === id)?.label ?? '-'
              }
            />
            <Table.Column
              title="创建时间"
              dataIndex="create_time"
              render={(time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
            />
            <Table.Column
              title="执行任务数"
              dataIndex="exec_count"
              render={(count: number) => count ?? '-'}
            />
            <Table.Column
              title="状态"
              dataIndex="status"
              render={(status: TaskStatus) => {
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
              width={280}
              render={(_, record: Task.Item) => (
                <>
                  <Button type="link" onClick={() => onCopy(record)}>
                    复制
                  </Button>
                  <Button
                    type="link"
                    href={`/tasks_management/tasks/detail/${record.id}`}
                  >
                    详情
                  </Button>{' '}
                  {record.one_time_task_type !== OneTimeTaskType.Immediate &&
                    (record.status === TaskStatus.Disabled ? (
                      <Button
                        type="link"
                        onClick={() => onAction(record.id, 'enable')}
                      >
                        启用
                      </Button>
                    ) : (
                      <Button
                        type="link"
                        onClick={() => onAction(record.id, 'disable')}
                      >
                        禁用
                      </Button>
                    ))}{' '}
                  {(record.status === TaskStatus.Disabled ||
                    record.one_time_task_type ===
                      OneTimeTaskType.Immediate) && (
                    <Button
                      type="link"
                      danger
                      onClick={() => onAction(record.id, 'delete')}
                    >
                      删除
                    </Button>
                  )}
                </>
              )}
            />
          </Table>
        </Card>
      </ContentLayout>

      <Modal
        centered
        onCancel={() => setShowCreateModal(false)}
        open={showCreateModal}
        title="新建任务"
        width={720}
        footer={null}
      >
        <Form<Task.CreateItem>
          className="mt-[36px]"
          form={form}
          name="new-task-form"
          onFinish={onFinish}
          autoComplete="off"
          labelCol={{ span: 4 }}
        >
          <Form.Item<Task.CreateItem>
            label="任务类型"
            name="task_type"
            rules={[
              {
                required: true,
                message: '请选择任务类型',
              },
            ]}
          >
            <Select options={taskTypeOptions} placeholder="选择任务类型" />
          </Form.Item>

          <Form.Item<Task.CreateItem>
            label="结构化规则"
            name="rule_id"
            rules={[
              {
                required: true,
                message: '请选择结构化规则',
              },
            ]}
          >
            <Select options={ruleOptions} placeholder="选择结构化规则" />
          </Form.Item>

          <Form.Item<Task.CreateItem>
            label="环境变量"
            help="环境变量可选项及对应值规则见文档"
          >
            <Form.List name="env_vars">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} align="baseline" style={{ width: '100%' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 0]}
                        className="w-[250px]"
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: '环境变量的字段名不能为空',
                          },
                        ]}
                      >
                        <Input placeholder="请输入字段名" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 1]}
                        className="w-[250px]"
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: '环境变量的字段值不能为空',
                          },
                        ]}
                      >
                        <Input placeholder="请输入字段值" />
                      </Form.Item>

                      <Button
                        danger
                        type="link"
                        onClick={() => remove(name)}
                        icon={
                          <i className="i-line-md:close-circle text-[20px]" />
                        }
                      />
                    </Space>
                  ))}

                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<i className="i-line-md:plus-circle text-[20px]" />}
                    >
                      添加
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item<Task.CreateItem>
            noStyle
            shouldUpdate={(pre, cur) => pre.task_type !== cur.task_type}
          >
            {() =>
              form.getFieldValue('task_type') === TaskType.Circular ? (
                <Form.Item<Task.CreateItem>
                  label="执行时间"
                  name="cron"
                  rules={[
                    {
                      required: true,
                      message: '请输入循环任务的 cron 表达式',
                    },
                  ]}
                  help="格式为 秒 分 时 日 月 周 年，例：每天早上 8 点 0 分 0 秒执行：0 0 8 * * * *"
                >
                  <Input placeholder="输入 7 位 cron 表达式" />
                </Form.Item>
              ) : (
                <Form.Item<Task.CreateItem>
                  noStyle
                  shouldUpdate={(pre, cur) =>
                    pre.one_time_task_type !== cur.one_time_task_type
                  }
                >
                  {() => (
                    <>
                      <Form.Item<Task.CreateItem>
                        label="执行方式"
                        name="one_time_task_type"
                        rules={[
                          {
                            required: true,
                            message: '请选择执行方式',
                          },
                        ]}
                      >
                        <Select
                          options={oneTimeTaskTypeOptions}
                          placeholder="选择执行方式"
                        />
                      </Form.Item>

                      {form.getFieldValue('one_time_task_type') ===
                        OneTimeTaskType.Schedule && (
                        <Form.Item<Task.CreateItem>
                          label="执行时间"
                          name="schedule_time"
                          rules={[
                            {
                              required: true,
                              message: '请选择执行时间',
                            },
                          ]}
                        >
                          <DatePicker showTime placeholder="选择执行时间" />
                        </Form.Item>
                      )}
                    </>
                  )}
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item noStyle>
            <div className="flex items-center justify-center mt-[36px]">
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TaskListPage;
