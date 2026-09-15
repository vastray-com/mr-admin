import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Switch,
  Table,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import {
  formatSchedule,
  formatTime,
  getApiErrorMessage,
  SCHEDULE_TYPE_OPTIONS,
  TASK_RUN_STATUS_MAP,
  WEEKDAY_OPTIONS,
} from '@/pages/AgentManagement/helper';
import { TaskRunDrawer } from '@/pages/AgentManagement/Tasks/components/TaskRunDrawer';
import type { TableProps } from 'antd';
import type { Agent } from '@/typing/agent';

/** 任务表单值（时间使用 dayjs，提交时转换为 HH:mm） */
type TaskForm = {
  name: string;
  requirement: string;
  skill_uids?: string[];
  schedule_type: Agent.ScheduleType;
  schedule_interval_minutes?: number;
  schedule_time?: Dayjs;
  schedule_weekday?: number;
  enabled: boolean;
};

/** 把 HH:mm 字符串转为用于 TimePicker 的 dayjs */
const timeToDayjs = (value: string): Dayjs | undefined => {
  const [hour, minute] = value.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return undefined;
  }
  return dayjs().hour(hour).minute(minute).second(0);
};

/** 智能体定时任务：列表、新建/编辑、启停、立即执行与执行记录 */
const AgentTaskPage: FC = () => {
  const { agentApi } = useApi();
  const { message, modal } = App.useApp();

  const [tasks, setTasks] = useState<Agent.Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [skills, setSkills] = useState<Agent.Skill[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent.Task>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TaskForm>();
  const scheduleType = Form.useWatch('schedule_type', form);

  const [runTask, setRunTask] = useState<Agent.Task>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentApi.listTasks();
      if (res.code === 200) {
        setTasks(res.data);
      } else {
        message.error(res.message || '获取任务列表失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '获取任务列表失败'));
    } finally {
      setLoading(false);
    }
  }, [agentApi, message]);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await agentApi.listSkills();
      if (res.code === 200) {
        setSkills(res.data);
      }
    } catch (error) {
      console.error('获取技能列表失败：', error);
    }
  }, [agentApi]);

  useEffect(() => {
    void fetchTasks();
    void fetchSkills();
  }, [fetchTasks, fetchSkills]);

  const skillNameMap = useMemo(
    () => new Map(skills.map((skill) => [skill.uid, skill.name])),
    [skills],
  );

  const skillOptions = useMemo(
    () =>
      skills.map((skill) => ({
        label: skill.enabled ? skill.name : `${skill.name}（已停用）`,
        value: skill.uid,
      })),
    [skills],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      return tasks;
    }
    return tasks.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.requirement.toLowerCase().includes(kw),
    );
  }, [tasks, keyword]);

  const openCreate = useCallback(() => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({
      schedule_type: 'daily',
      schedule_interval_minutes: 1440,
      schedule_weekday: 1,
      schedule_time: dayjs().hour(8).minute(0).second(0),
      enabled: true,
    });
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record: Agent.Task) => {
      setEditing(record);
      form.setFieldsValue({
        name: record.name,
        requirement: record.requirement,
        skill_uids: record.skill_uids,
        schedule_type: record.schedule_type,
        schedule_interval_minutes: record.schedule_interval_minutes,
        schedule_time: record.schedule_time
          ? timeToDayjs(record.schedule_time)
          : undefined,
        schedule_weekday: record.schedule_weekday,
        enabled: record.enabled,
      });
      setOpen(true);
    },
    [form],
  );

  // 交付物链接（/agent/tasks?uid=xxx）直达：列表加载后自动打开对应任务
  const location = useLocation();
  const handledKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (handledKeyRef.current === location.key) {
      return;
    }
    const uid = new URLSearchParams(location.search).get('uid');
    if (!uid) {
      return;
    }
    const target = tasks.find((item) => item.uid === uid);
    if (target) {
      handledKeyRef.current = location.key;
      openEdit(target);
    }
  }, [tasks, location.key, location.search, openEdit]);

  const onSave = useCallback(
    async (values: TaskForm) => {
      setSaving(true);
      try {
        const payload: Agent.TaskPayload = {
          name: values.name.trim(),
          requirement: values.requirement.trim(),
          skill_uids: values.skill_uids ?? [],
          schedule_type: values.schedule_type,
          schedule_interval_minutes:
            values.schedule_type === 'interval'
              ? (values.schedule_interval_minutes ?? 60)
              : 1440,
          schedule_time: values.schedule_time
            ? values.schedule_time.format('HH:mm')
            : '',
          schedule_weekday:
            values.schedule_type === 'weekly'
              ? (values.schedule_weekday ?? 1)
              : 0,
          enabled: values.enabled,
        };
        const res = editing
          ? await agentApi.updateTask(editing.uid, payload)
          : await agentApi.createTask(payload);
        if (res.code === 200) {
          message.success(editing ? '更新成功' : '创建成功');
          setOpen(false);
          form.resetFields();
          void fetchTasks();
        } else {
          message.error(res.message || '保存失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '保存失败'));
      } finally {
        setSaving(false);
      }
    },
    [agentApi, editing, form, message, fetchTasks],
  );

  const onToggleEnabled = useCallback(
    async (record: Agent.Task, enabled: boolean) => {
      try {
        const res = await agentApi.setTaskEnabled(record.uid, enabled);
        if (res.code === 200) {
          message.success(enabled ? '已启用' : '已停用');
          setTasks((prev) =>
            prev.map((item) => (item.uid === record.uid ? res.data : item)),
          );
        } else {
          message.error(res.message || '操作失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '操作失败'));
      }
    },
    [agentApi, message],
  );

  const onRunNow = useCallback(
    async (record: Agent.Task) => {
      try {
        const res = await agentApi.runTaskNow(record.uid);
        if (res.code === 200) {
          message.success('已触发执行');
          setRunTask(record);
          setDrawerOpen(true);
          void fetchTasks();
        } else {
          message.error(res.message || '触发执行失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '触发执行失败'));
      }
    },
    [agentApi, message, fetchTasks],
  );

  const openRuns = useCallback((record: Agent.Task) => {
    setRunTask(record);
    setDrawerOpen(true);
  }, []);

  const onDelete = useCallback(
    (record: Agent.Task) => {
      modal.confirm({
        title: '删除任务',
        content: `确认删除任务「${record.name}」及其执行记录吗？`,
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const res = await agentApi.deleteTask(record.uid);
            if (res.code === 200) {
              message.success('删除成功');
              void fetchTasks();
            } else {
              message.error(res.message || '删除失败');
            }
          } catch (error) {
            message.error(getApiErrorMessage(error, '删除失败'));
          }
        },
      });
    },
    [agentApi, message, modal, fetchTasks],
  );

  const columns: TableProps<Agent.Task>['columns'] = [
    {
      title: '任务名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string, record) => (
        <>
          <div className="text-fg-primary font-medium">{name}</div>
          <Typography.Paragraph
            className="!mb-0 !text-[12px]"
            type="secondary"
            ellipsis={{ rows: 1, tooltip: record.requirement }}
          >
            {record.requirement}
          </Typography.Paragraph>
        </>
      ),
    },
    {
      title: '调度规则',
      key: 'schedule',
      width: 150,
      render: (_, record) => formatSchedule(record),
    },
    {
      title: '绑定技能',
      dataIndex: 'skill_uids',
      width: 180,
      render: (uids: string[]) =>
        uids && uids.length > 0 ? (
          <div className="flex flex-wrap gap-[4px]">
            {uids.map((uid) => (
              <Tag key={uid}>{skillNameMap.get(uid) ?? uid}</Tag>
            ))}
          </div>
        ) : (
          '-'
        ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      render: (enabled: boolean, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => void onToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: '上次执行',
      key: 'last_run',
      width: 200,
      render: (_, record) => {
        const config = record.last_run_status
          ? TASK_RUN_STATUS_MAP[record.last_run_status]
          : undefined;
        return (
          <div className="flex items-center gap-[6px]">
            {config ? (
              <Tag color={config.color}>{config.text}</Tag>
            ) : (
              <Tag>未执行</Tag>
            )}
            <span className="text-fg-tertiary text-[12px]">
              {formatTime(record.last_run_at)}
            </span>
          </div>
        );
      },
    },
    {
      title: '下次执行',
      dataIndex: 'next_run_at',
      width: 170,
      render: (value?: string | null) => formatTime(value),
    },
    {
      title: '运行次数',
      dataIndex: 'run_count',
      width: 90,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 230,
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => void onRunNow(record)}>
            立即执行
          </Button>
          <Button type="link" onClick={() => openRuns(record)}>
            执行记录
          </Button>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => onDelete(record)}>
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <ContentLayout
        title="智能体定时任务"
        action={
          <Button type="primary" onClick={openCreate}>
            新建任务
          </Button>
        }
      >
        <Card>
          <div className="mb-[16px]">
            <Input
              className="max-w-[360px]"
              placeholder="按任务名称/需求搜索"
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <Table<Agent.Task>
            rowKey="uid"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </Card>
      </ContentLayout>

      <Modal
        centered
        open={open}
        title={editing ? '编辑任务' : '新建任务'}
        onCancel={() => setOpen(false)}
        onOk={form.submit}
        confirmLoading={saving}
        destroyOnHidden
        width={760}
      >
        <Form<TaskForm>
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          onFinish={onSave}
          initialValues={{
            schedule_type: 'daily',
            schedule_interval_minutes: 1440,
            schedule_weekday: 1,
            enabled: true,
          }}
        >
          <Form.Item<TaskForm>
            label="任务名称"
            name="name"
            rules={[
              { required: true, message: '请输入任务名称' },
              { whitespace: true, message: '任务名称不能为空' },
            ]}
          >
            <Input maxLength={80} placeholder="例如：每日门诊数据概览" />
          </Form.Item>

          <Form.Item<TaskForm>
            label="需求描述"
            name="requirement"
            rules={[
              { required: true, message: '请输入任务需求描述' },
              { whitespace: true, message: '任务需求描述不能为空' },
            ]}
            extra="每次到期时，该需求会作为指令交给智能体执行。"
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 8 }}
              placeholder="描述希望智能体每次执行的任务"
            />
          </Form.Item>

          <Form.Item<TaskForm> label="绑定技能" name="skill_uids">
            <Select
              mode="multiple"
              allowClear
              placeholder="选择要注入的技能（仅已启用的技能会生效）"
              options={skillOptions}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item<TaskForm> label="调度方式" name="schedule_type">
            <Radio.Group>
              {SCHEDULE_TYPE_OPTIONS.map((option) => (
                <Radio.Button key={option.value} value={option.value}>
                  {option.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          {scheduleType === 'interval' && (
            <Form.Item<TaskForm>
              label="执行间隔（分钟）"
              name="schedule_interval_minutes"
              rules={[{ required: true, message: '请输入执行间隔' }]}
            >
              <InputNumber min={1} max={10080} className="w-[220px]" />
            </Form.Item>
          )}

          {scheduleType === 'daily' && (
            <Form.Item<TaskForm>
              label="执行时刻"
              name="schedule_time"
              rules={[{ required: true, message: '请选择执行时刻' }]}
            >
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
          )}

          {scheduleType === 'weekly' && (
            <div className="flex items-center gap-[12px]">
              <Form.Item<TaskForm>
                label="星期"
                name="schedule_weekday"
                rules={[{ required: true, message: '请选择星期' }]}
              >
                <Select options={WEEKDAY_OPTIONS} className="w-[120px]" />
              </Form.Item>
              <Form.Item<TaskForm>
                label="执行时刻"
                name="schedule_time"
                rules={[{ required: true, message: '请选择执行时刻' }]}
              >
                <TimePicker format="HH:mm" minuteStep={5} />
              </Form.Item>
            </div>
          )}

          <Form.Item<TaskForm>
            label="启用"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <TaskRunDrawer
        task={runTask}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

export default AgentTaskPage;
