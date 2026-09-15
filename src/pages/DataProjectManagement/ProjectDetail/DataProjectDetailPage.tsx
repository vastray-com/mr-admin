import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Spin,
  Table,
} from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import type { DataProject } from '@/typing/dataProject';

type ViewFormValues = {
  name: string;
  sql: string;
  comment?: string;
};

const DataProjectDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const { message, modal } = App.useApp();
  const { dataProjectApi } = useApi();

  const [detail, setDetail] = useState<DataProject.Item | null>(null);
  const [views, setViews] = useState<DataProject.View[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await dataProjectApi.getDetail(uid);
      if (res.code === 200) {
        setDetail(res.data);
      } else {
        message.error(res.message || '获取项目详情失败');
      }
    } catch (e) {
      console.error('获取项目详情失败:', e);
      message.error('获取项目详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dataProjectApi, message, uid]);

  const fetchViews = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await dataProjectApi.getViewList({ project_uid: uid });
      if (res.code === 200) {
        setViews(res.data.data);
      } else {
        message.error(res.message || '获取视图列表失败');
      }
    } catch (e) {
      console.error('获取视图列表失败:', e);
      message.error('获取视图列表失败，请稍后重试');
    }
  }, [dataProjectApi, message, uid]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchDetail(), fetchViews()]);
  }, [fetchDetail, fetchViews]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ==================== 新建视图 ====================
  const [form] = Form.useForm<ViewFormValues>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreateView = useCallback(() => {
    form.resetFields();
    setOpen(true);
  }, [form]);

  const closeViewModal = useCallback(() => {
    setOpen(false);
    form.resetFields();
  }, [form]);

  const onCreateView = useCallback(
    async (values: ViewFormValues) => {
      if (!uid) return;
      setSaving(true);
      try {
        const sql = values.sql.trim();
        if (!sql) {
          message.error('请输入视图 SQL');
          return;
        }

        const res = await dataProjectApi.createView({
          project_uid: uid,
          name: values.name.trim(),
          sql,
          comment: values.comment?.trim() || undefined,
        });

        if (res.code === 200) {
          message.success('创建成功');
          closeViewModal();
          fetchViews();
        } else {
          message.error(res.message || '创建失败');
        }
      } catch (e) {
        console.error('创建视图失败:', e);
        message.error('创建失败，请稍后重试');
      } finally {
        setSaving(false);
      }
    },
    [closeViewModal, dataProjectApi, fetchViews, message, uid],
  );

  const onDeleteView = useCallback(
    (view: DataProject.View) => {
      modal.confirm({
        title: '确认删除视图',
        content: `确认删除视图「${view.name}」吗？该操作会同时删除 Doris 中的视图。`,
        onOk: async () => {
          const res = await dataProjectApi.deleteView({ uid: view.uid });
          if (res.code === 200) {
            message.success('删除成功');
            fetchViews();
          } else {
            message.error(res.message || '删除失败');
          }
        },
      });
    },
    [dataProjectApi, fetchViews, message, modal],
  );

  const projectInfo = useMemo(() => {
    if (!detail) return [];
    return [
      { key: 'name', label: '项目名称', children: detail.name },
      { key: 'db', label: 'Doris 数据库', children: detail.doris_database },
      { key: 'comment', label: '描述', children: detail.comment || '-' },
      { key: 'creator', label: '创建人', children: detail.creator_name || '-' },
      {
        key: 'updated',
        label: '更新时间',
        children: detail.updated_at
          ? dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
      },
    ];
  }, [detail]);

  if (!uid) {
    return <div className="p-[20px]">缺少项目 ID</div>;
  }

  if (loading && !detail) {
    return (
      <div className="h-full flex items-center justify-center gap-[8px]">
        <Spin />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <ContentLayout
      title="数据项目详情"
      breadcrumb={[
        { title: <Link to="/data_project/list">数据项目</Link> },
        { title: '项目详情' },
      ]}
      action={
        <Button type="primary" onClick={openCreateView}>
          新建视图
        </Button>
      }
    >
      <Card title="项目信息">
        <Descriptions bordered size="small" column={3} items={projectInfo} />
      </Card>

      <Card className="mt-[16px]" title="视图列表">
        {views.length < 1 ? (
          <Empty description="暂无视图，请先新建视图" />
        ) : (
          <Table<DataProject.View>
            dataSource={views}
            rowKey="uid"
            pagination={false}
            onRow={(_, i) => ({
              className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
            })}
          >
            <Table.Column
              title="视图名称"
              dataIndex="name"
              render={(name: string, record: DataProject.View) => (
                <Link to={`/data_project/view/${record.uid}`}>{name}</Link>
              )}
            />
            <Table.Column
              title="描述"
              dataIndex="comment"
              render={(comment?: string) => comment || '-'}
            />
            <Table.Column
              title="更新时间"
              dataIndex="updated_at"
              width={180}
              render={(time?: string) =>
                time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
              }
            />
            <Table.Column
              title="操作"
              key="action"
              width={120}
              render={(_, record: DataProject.View) => (
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => onDeleteView(record)}
                >
                  删除
                </Button>
              )}
            />
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title="新建视图"
        width={760}
        onCancel={closeViewModal}
        onOk={form.submit}
        confirmLoading={saving}
        centered
        destroyOnHidden
        mask={{ closable: false }}
      >
        <Form<ViewFormValues>
          form={form}
          layout="vertical"
          onFinish={onCreateView}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item<ViewFormValues>
            label="视图名称"
            name="name"
            rules={[
              { required: true, message: '请输入视图名称' },
              { whitespace: true, message: '视图名称不能为空' },
            ]}
          >
            <Input
              placeholder="仅支持字母、数字和下划线，且不以数字开头"
              maxLength={64}
            />
          </Form.Item>

          <Form.Item<ViewFormValues>
            label="视图 SQL"
            name="sql"
            rules={[{ required: true, message: '请输入视图 SQL' }]}
          >
            <Input.TextArea
              rows={10}
              style={{ fontFamily: 'monospace' }}
              placeholder="SELECT ...（仅支持单条 SELECT / WITH 查询）"
            />
          </Form.Item>

          <Form.Item<ViewFormValues> label="描述" name="comment">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 3 }}
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ContentLayout>
  );
};

export default DataProjectDetailPage;
