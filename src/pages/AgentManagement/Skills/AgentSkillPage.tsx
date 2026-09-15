import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
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
import { formatTime, getApiErrorMessage } from '@/pages/AgentManagement/helper';
import type { TableProps } from 'antd';
import type { Agent } from '@/typing/agent';

/** 智能体技能管理：技能库列表、新建/编辑/启停/删除 */
const AgentSkillPage: FC = () => {
  const { agentApi } = useApi();
  const { message, modal } = App.useApp();

  const [skills, setSkills] = useState<Agent.Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Agent.Skill>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<Agent.SkillPayload>();

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agentApi.listSkills();
      if (res.code === 200) {
        setSkills(res.data);
      } else {
        message.error(res.message || '获取技能列表失败');
      }
    } catch (error) {
      message.error(getApiErrorMessage(error, '获取技能列表失败'));
    } finally {
      setLoading(false);
    }
  }, [agentApi, message]);

  useEffect(() => {
    void fetchSkills();
  }, [fetchSkills]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      return skills;
    }
    return skills.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw),
    );
  }, [skills, keyword]);

  const openCreate = useCallback(() => {
    setEditing(undefined);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record: Agent.Skill) => {
      setEditing(record);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
        content: record.content,
        enabled: record.enabled,
      });
      setOpen(true);
    },
    [form],
  );

  // 交付物链接（/agent/skills?uid=xxx）直达：列表加载后自动打开对应技能
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
    const target = skills.find((item) => item.uid === uid);
    if (target) {
      handledKeyRef.current = location.key;
      openEdit(target);
    }
  }, [skills, location.key, location.search, openEdit]);

  const onSave = useCallback(
    async (values: Agent.SkillPayload) => {
      setSaving(true);
      try {
        const payload: Agent.SkillPayload = {
          name: values.name.trim(),
          description: values.description?.trim() ?? '',
          content: values.content.trim(),
          enabled: values.enabled,
        };
        const res = editing
          ? await agentApi.updateSkill(editing.uid, payload)
          : await agentApi.createSkill(payload);
        if (res.code === 200) {
          message.success(editing ? '更新成功' : '创建成功');
          setOpen(false);
          form.resetFields();
          void fetchSkills();
        } else {
          message.error(res.message || '保存失败');
        }
      } catch (error) {
        message.error(getApiErrorMessage(error, '保存失败'));
      } finally {
        setSaving(false);
      }
    },
    [agentApi, editing, form, message, fetchSkills],
  );

  const onToggleEnabled = useCallback(
    async (record: Agent.Skill, enabled: boolean) => {
      try {
        const res = await agentApi.setSkillEnabled(record.uid, enabled);
        if (res.code === 200) {
          message.success(enabled ? '已启用' : '已停用');
          setSkills((prev) =>
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

  const onDelete = useCallback(
    (record: Agent.Skill) => {
      modal.confirm({
        title: '删除技能',
        content: `确认删除技能「${record.name}」吗？删除后不可恢复。`,
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const res = await agentApi.deleteSkill(record.uid);
            if (res.code === 200) {
              message.success('删除成功');
              void fetchSkills();
            } else {
              message.error(res.message || '删除失败');
            }
          } catch (error) {
            message.error(getApiErrorMessage(error, '删除失败'));
          }
        },
      });
    },
    [agentApi, message, modal, fetchSkills],
  );

  const columns: TableProps<Agent.Skill>['columns'] = [
    {
      title: '技能名称',
      dataIndex: 'name',
      width: 200,
      render: (name: string, record) => (
        <div className="flex items-center gap-[6px]">
          <span className="text-fg-primary font-medium">{name}</span>
          {record.built_in && <Tag color="blue">内置</Tag>}
        </div>
      ),
    },
    {
      title: '简介',
      dataIndex: 'description',
      width: 240,
      render: (text: string) => text || '-',
    },
    {
      title: '指令内容',
      dataIndex: 'content',
      render: (text: string) => (
        <Typography.Paragraph
          className="!mb-0"
          ellipsis={{ rows: 2, tooltip: text }}
        >
          {text}
        </Typography.Paragraph>
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
      title: '创建人',
      dataIndex: 'actor',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 170,
      render: (value?: string | null) => formatTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            disabled={record.built_in}
            onClick={() => onDelete(record)}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <ContentLayout
        title="智能体技能"
        action={
          <Button type="primary" onClick={openCreate}>
            新建技能
          </Button>
        }
      >
        <Card>
          <div className="mb-[16px]">
            <Input
              className="max-w-[360px]"
              placeholder="按技能名称/简介搜索"
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <Table<Agent.Skill>
            rowKey="uid"
            loading={loading}
            dataSource={filtered}
            columns={columns}
            pagination={false}
          />
        </Card>
      </ContentLayout>

      <Modal
        centered
        open={open}
        title={editing ? '编辑技能' : '新建技能'}
        onCancel={() => setOpen(false)}
        onOk={form.submit}
        confirmLoading={saving}
        destroyOnHidden
        width={720}
      >
        <Form<Agent.SkillPayload>
          form={form}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
          onFinish={onSave}
          initialValues={{ enabled: true }}
        >
          <Form.Item<Agent.SkillPayload>
            label="技能名称"
            name="name"
            rules={[
              { required: true, message: '请输入技能名称' },
              { whitespace: true, message: '技能名称不能为空' },
            ]}
          >
            <Input maxLength={80} placeholder="例如：门诊数据统计口径" />
          </Form.Item>

          <Form.Item<Agent.SkillPayload> label="技能简介" name="description">
            <Input.TextArea
              autoSize={{ minRows: 1, maxRows: 3 }}
              maxLength={200}
              placeholder="一句话描述该技能的用途"
            />
          </Form.Item>

          <Form.Item<Agent.SkillPayload>
            label="指令内容"
            name="content"
            rules={[
              { required: true, message: '请输入技能指令正文' },
              { whitespace: true, message: '技能指令正文不能为空' },
            ]}
            extra="启用的技能会作为指令注入智能体上下文，涉及对应场景时优先遵守。"
          >
            <Input.TextArea
              autoSize={{ minRows: 6, maxRows: 16 }}
              placeholder="描述该场景下智能体应遵循的规则、口径或步骤"
            />
          </Form.Item>

          <Form.Item<Agent.SkillPayload>
            label="启用"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AgentSkillPage;
