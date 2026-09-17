import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useEffect, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import type { ExternalDataSource } from '@/typing/externalDataSource';

type ExternalSourceFormValues = {
  name: string;
  source_type: ExternalDataSource.SourceType;
  host: string;
  port: number;
  database_name?: string;
  schema_name?: string;
  username: string;
  password?: string;
  enabled: boolean;
  options_json?: string;
};

const SOURCE_TYPE_OPTIONS = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'pg' },
  { label: 'SQL Server', value: 'sqlserver' },
  { label: 'Oracle', value: 'oracle' },
];

const DEFAULT_PORT_MAP: Record<string, number> = {
  mysql: 3306,
  pg: 5432,
  sqlserver: 1433,
  oracle: 1521,
};

const ExternalDataSourcePage: FC = () => {
  const { message } = App.useApp();
  const { externalDataSourceApi } = useApi();

  const [items, setItems] = useState<ExternalDataSource.Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalDataSource.Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingUid, setTestingUid] = useState<string>('');

  const [form] = Form.useForm<ExternalSourceFormValues>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await externalDataSourceApi.getList({
        include_disabled: includeDisabled,
      });
      if (res.code === 200) {
        setItems(res.data || []);
      } else {
        message.error(res.message || '查询失败');
      }
    } finally {
      setLoading(false);
    }
  }, [externalDataSourceApi, includeDisabled, message]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCreate = useCallback(() => {
    setEditing(null);
    form.setFieldsValue({
      source_type: 'mysql',
      port: 3306,
      enabled: true,
    });
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (item: ExternalDataSource.Item) => {
      setEditing(item);
      form.setFieldsValue({
        name: item.name,
        source_type: item.source_type as ExternalDataSource.SourceType,
        host: item.host,
        port: item.port,
        database_name: item.database_name,
        schema_name: item.schema_name,
        username: item.username,
        password: '',
        enabled: item.enabled,
      });
      setOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  }, [form]);

  const onSourceTypeChange = useCallback(
    (value: ExternalDataSource.SourceType) => {
      form.setFieldValue('port', DEFAULT_PORT_MAP[value]);
    },
    [form],
  );

  const onSave = useCallback(
    async (values: ExternalSourceFormValues) => {
      setSaving(true);
      try {
        if (editing) {
          const res = await externalDataSourceApi.update({
            uid: editing.uid,
            name: values.name.trim(),
            source_type: values.source_type,
            host: values.host.trim(),
            port: values.port,
            database_name: values.database_name?.trim() || '',
            schema_name: values.schema_name?.trim() || '',
            username: values.username.trim(),
            password: values.password?.trim() || '',
            enabled: values.enabled,
            options_json: values.options_json?.trim() || '',
          });
          if (res.code === 200) {
            message.success('更新成功');
            closeModal();
            await refresh();
          } else {
            message.error(res.message || '更新失败');
          }
        } else {
          const password = values.password?.trim();
          if (!password) {
            message.error('请输入密码');
            return;
          }
          const res = await externalDataSourceApi.create({
            name: values.name.trim(),
            source_type: values.source_type,
            host: values.host.trim(),
            port: values.port,
            database_name: values.database_name?.trim() || undefined,
            schema_name: values.schema_name?.trim() || undefined,
            username: values.username.trim(),
            password,
            enabled: values.enabled,
            options_json: values.options_json?.trim() || undefined,
          });
          if (res.code === 200) {
            message.success('创建成功');
            closeModal();
            await refresh();
          } else {
            message.error(res.message || '创建失败');
          }
        }
      } finally {
        setSaving(false);
      }
    },
    [closeModal, editing, externalDataSourceApi, message, refresh],
  );

  const onDelete = useCallback(
    async (uid: string) => {
      const res = await externalDataSourceApi.delete(uid);
      if (res.code === 200) {
        message.success('删除成功');
        await refresh();
      } else {
        message.error(res.message || '删除失败');
      }
    },
    [externalDataSourceApi, message, refresh],
  );

  const onToggleEnabled = useCallback(
    async (item: ExternalDataSource.Item, enabled: boolean) => {
      const res = await externalDataSourceApi.setEnabled(item.uid, enabled);
      if (res.code === 200) {
        message.success(enabled ? '已启用' : '已停用');
        await refresh();
      } else {
        message.error(res.message || '操作失败');
      }
    },
    [externalDataSourceApi, message, refresh],
  );

  const onTestConnection = useCallback(
    async (item: ExternalDataSource.Item) => {
      setTestingUid(item.uid);
      try {
        const res = await externalDataSourceApi.testConnection(item.uid);
        if (res.code === 200) {
          if (res.data.success) {
            message.success(`${item.name} 连接成功`);
          } else {
            message.warning(res.data.message || '连接失败');
          }
          await refresh();
        } else {
          message.error(res.message || '测试失败');
        }
      } finally {
        setTestingUid('');
      }
    },
    [externalDataSourceApi, message, refresh],
  );

  const modalTitle = editing ? '编辑外部数据源' : '新建外部数据源';

  return (
    <ContentLayout
      title="外部数据源管理"
      action={
        <div className="flex items-center gap-[12px]">
          <span className="text-[13px] text-[#666]">显示停用</span>
          <Switch checked={includeDisabled} onChange={setIncludeDisabled} />
          <Button onClick={() => void refresh()}>刷新</Button>
          <Button type="primary" onClick={openCreate}>
            新建数据源
          </Button>
        </div>
      }
    >
      <Card className="h-full">
        <Table<ExternalDataSource.Item>
          rowKey="uid"
          loading={loading}
          dataSource={items}
          pagination={false}
          onRow={(_, i) => ({
            className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
          })}
        >
          <Table.Column title="名称" dataIndex="name" width={180} />
          <Table.Column
            title="类型"
            dataIndex="source_type"
            width={120}
            render={(type: string) => <Tag>{type}</Tag>}
          />
          <Table.Column
            title="地址"
            key="host_port"
            render={(_, row: ExternalDataSource.Item) =>
              `${row.host}:${row.port}`
            }
          />
          <Table.Column
            title="数据库/schema"
            key="db_schema"
            render={(_, row: ExternalDataSource.Item) =>
              `${row.database_name || '-'} / ${row.schema_name || '-'}`
            }
          />
          <Table.Column title="用户名" dataIndex="username" width={130} />
          <Table.Column
            title="状态"
            width={120}
            render={(_, row: ExternalDataSource.Item) =>
              row.enabled ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>
            }
          />
          <Table.Column
            title="最近检测"
            width={260}
            render={(_, row: ExternalDataSource.Item) => (
              <div>
                <div>
                  {row.last_test_status ? (
                    <Tag
                      color={
                        row.last_test_status === 'success' ? 'green' : 'orange'
                      }
                    >
                      {row.last_test_status}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </div>
                <div className="text-[#999] text-[12px]">
                  {row.last_test_at
                    ? dayjs(row.last_test_at).format('YYYY-MM-DD HH:mm:ss')
                    : ''}
                </div>
              </div>
            )}
          />
          <Table.Column
            title="操作"
            width={300}
            render={(_, row: ExternalDataSource.Item) => (
              <div className="flex flex-wrap">
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  loading={testingUid === row.uid}
                  onClick={() => void onTestConnection(row)}
                >
                  连通性测试
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => void onToggleEnabled(row, !row.enabled)}
                >
                  {row.enabled ? '停用' : '启用'}
                </Button>
                <Popconfirm
                  title="删除外部数据源"
                  description={`确认删除「${row.name}」吗？`}
                  onConfirm={() => void onDelete(row.uid)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger size="small">
                    删除
                  </Button>
                </Popconfirm>
              </div>
            )}
          />
        </Table>
      </Card>

      <Modal
        open={open}
        title={modalTitle}
        onCancel={closeModal}
        onOk={form.submit}
        confirmLoading={saving}
        centered
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Form<ExternalSourceFormValues>
          form={form}
          layout="vertical"
          onFinish={(v) => void onSave(v)}
          requiredMark={false}
        >
          <Form.Item
            label="数据源名称"
            name="name"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            label="数据源类型"
            name="source_type"
            rules={[{ required: true, message: '请选择数据源类型' }]}
          >
            <Select
              options={SOURCE_TYPE_OPTIONS}
              onChange={onSourceTypeChange}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-[12px]">
            <Form.Item
              label="Host"
              name="host"
              rules={[{ required: true, message: '请输入主机地址' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Port"
              name="port"
              rules={[{ required: true, message: '请输入端口' }]}
            >
              <InputNumber className="w-full" min={1} max={65535} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-[12px]">
            <Form.Item label="数据库名" name="database_name">
              <Input placeholder="MySQL/PG 建议必填" />
            </Form.Item>
            <Form.Item label="Schema" name="schema_name">
              <Input placeholder="可选" />
            </Form.Item>
          </div>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={editing ? '密码（留空不修改）' : '密码'}
            name="password"
            rules={
              editing ? undefined : [{ required: true, message: '请输入密码' }]
            }
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="扩展参数(JSON)" name="options_json">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="启用" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </ContentLayout>
  );
};

export default ExternalDataSourcePage;
