import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
} from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
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

const ENV_VAR_OPTIONS = [
  {
    label: '偏移天数（循环任务执行时取数向前 X 天）',
    value: 'interval',
    input_type: 'number',
  },
  {
    label: '开始时间（一次性任务取数范围开始时间）',
    value: 'start_time',
    input_type: 'date',
  },
  {
    label: '结束时间（一次性任务取数范围结束时间）',
    value: 'end_time',
    input_type: 'date',
  },
  {
    label: '诊断过滤',
    value: 'diagnosis',
    input_type: 'multi_text',
  },
];

const DatasetListPage = () => {
  const { taskApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<Task.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: taskApi.getTaskList,
    setData: setData,
  });

  // 新建任务
  const ruleOptions = useCacheStore((s) => s.structuredRulesetOptions);
  const [form] = Form.useForm<Task.CreateItem>();
  const newTaskData = useRef<Task.CreateItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    form.resetFields();
    setShowCreateModal(true);
  };
  const onCopy = (record: Task.Item) => {
    console.log('xxx', record);
    form.resetFields();
    newTaskData.current = {
      ...record,
      schedule_time: record.schedule_time
        ? dayjs(record.schedule_time)
        : undefined,
      env_vars: Object.entries(record.env_vars || {}),
    };
    console.log('复制的任务数据：', newTaskData.current);
    form.setFieldsValue(newTaskData.current);
    // 打开新建任务模态框
    setShowCreateModal(true);
  };

  const onAction = useCallback(
    (uid: string, action: Task.ActionParams['action']) => {
      console.log(`执行操作：${action}，任务 ID：${uid}`);
      taskApi
        .actionTask({ uid, action })
        .then((res) => {
          if (res.code === 200) {
            message.success(`操作成功`);
            // 刷新任务列表
            refresh();
          } else {
            message.error(`操作失败：${res.message}`);
          }
        })
        .catch((err) => {
          console.error(`操作任务失败：`, err);
          message.error('操作任务失败，请稍后重试');
        });
    },
    [taskApi, refresh, message.error, message.success],
  );

  const onFinish = useCallback(
    async (values: Task.CreateItem) => {
      console.log('提交的新任务数据：', values);
      // 转换日期格式
      const envVars: Record<string, string> = {};
      if (values.env_vars.length > 0) {
        values.env_vars.forEach((v) => {
          if (v && v.length === 2) {
            const [key, val] = v;
            const opt = ENV_VAR_OPTIONS.find((o) => o.value === key);
            if (opt?.input_type === 'date' && dayjs(val).isValid()) {
              envVars[key] = dayjs(val).toISOString();
            } else {
              envVars[key] = val;
            }
          }
        });
      }
      const newTaskData: Task.Item = {
        ...values,
        schedule_time: values.schedule_time?.toISOString(),
        env_vars: envVars,
      };
      console.log('转换后的新任务数据：', newTaskData);
      try {
        const res = await taskApi.createTask(newTaskData);
        if (res.code === 200) {
          message.success('任务创建成功');
          setShowCreateModal(false);
          form.resetFields();
          // 刷新任务列表
          refresh();
        } else {
          message.error(`创建任务失败：${res.message}`);
        }
      } catch (error) {
        console.error('创建任务失败：', error);
        message.error('创建任务失败，请稍后重试');
      }
    },
    [taskApi, refresh, form.resetFields, message.error, message.success],
  );

  // 推送规则联动
  const pushRules = useCacheStore((s) => s.pushRuleOptions);
  const rule_uid = Form.useWatch('rule_uid', form);
  const pushRuleOptions = useMemo(() => {
    if (!rule_uid) return [];
    return pushRules[rule_uid] || [];
  }, [rule_uid, pushRules]);

  // 环境变量选择时过滤已选项
  const envVars = Form.useWatch('env_vars', form);
  const envVarOptions = useMemo(() => {
    if (!envVars) return ENV_VAR_OPTIONS;
    const selectedKeys = envVars.filter((v) => !!v && !!v[0]).map((v) => v[0]);
    return ENV_VAR_OPTIONS.filter((o) => !selectedKeys.includes(o.value));
  }, [envVars]);

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
          <Table<Task.Item> dataSource={data} rowKey="uid" pagination={false}>
            <Table.Column title="任务编号" dataIndex="uid" />
            <Table.Column
              title="任务类型"
              dataIndex="task_type"
              render={(type: TaskType) => taskTypeMap[type]}
            />
            <Table.Column
              title="结构化规则"
              dataIndex="rule_uid"
              render={(uid) =>
                ruleOptions.find((rule) => rule.value === uid)?.label ?? '-'
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
                  <Link to={`/task_management/detail/${record.uid}`}>
                    <Button type="link">详情</Button>
                  </Link>{' '}
                  {record.one_time_task_type !== OneTimeTaskType.Immediate &&
                    (record.status === TaskStatus.Disabled ? (
                      <Button
                        type="link"
                        onClick={() => onAction(record.uid, 'enable')}
                      >
                        启用
                      </Button>
                    ) : (
                      <Button
                        type="link"
                        onClick={() => onAction(record.uid, 'disable')}
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
                      onClick={() => onAction(record.uid, 'delete')}
                    >
                      删除
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

      <Modal
        centered
        onCancel={() => setShowCreateModal(false)}
        open={showCreateModal}
        title="新建任务"
        width={830}
        footer={null}
      >
        <Form<Task.CreateItem>
          className="mt-[36px]"
          form={form}
          name="new-task-form"
          onFinish={onFinish}
          onFinishFailed={(v) => {
            console.log('表单提交失败：', v);
          }}
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
            name="dataset_uid"
            rules={[
              {
                required: true,
                message: '请选择结构化规则',
              },
            ]}
          >
            <Select
              options={ruleOptions}
              placeholder="选择结构化规则"
              onChange={() => form.setFieldValue('push_uids', [])}
            />
          </Form.Item>

          <Form.Item noStyle dependencies={['rule_uid']}>
            {() => (
              <Form.Item<Task.CreateItem> label="推送规则" name="push_uids">
                <Select
                  options={pushRuleOptions}
                  placeholder="选择推送规则"
                  allowClear
                  mode="multiple"
                />
              </Form.Item>
            )}
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
                        className="w-[360px]"
                      >
                        <Select
                          placeholder="请选择配置项"
                          options={envVarOptions}
                          labelRender={(v) =>
                            ENV_VAR_OPTIONS.find((o) => o.value === v.value)
                              ?.label
                          }
                        />
                      </Form.Item>
                      <Form.Item shouldUpdate noStyle>
                        {() => {
                          if (!envVars || !envVars[name]) return null;
                          const opt = ENV_VAR_OPTIONS.find(
                            (o) => o.value === envVars[name][0],
                          );
                          return opt?.input_type === 'number' ? (
                            <Form.Item
                              {...restField}
                              name={[name, 1]}
                              className="w-[250px]"
                            >
                              <InputNumber
                                precision={0}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          ) : opt?.input_type === 'date' ? (
                            <Form.Item
                              {...restField}
                              name={[name, 1]}
                              className="w-[250px]"
                            >
                              <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                          ) : opt?.input_type === 'multi_text' ? (
                            <Form.Item
                              {...restField}
                              name={[name, 1]}
                              className="w-[250px]"
                            >
                              <Select mode="tags" options={[]} open={false} />
                            </Form.Item>
                          ) : null;
                        }}
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

                  {(!envVars || envVars.length < ENV_VAR_OPTIONS.length) && (
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={
                          <i className="i-line-md:plus-circle text-[20px]" />
                        }
                      >
                        添加
                      </Button>
                    </Form.Item>
                  )}
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

export default DatasetListPage;
