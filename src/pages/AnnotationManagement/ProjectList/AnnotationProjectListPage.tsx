import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { useUserStore } from '@/store/useUserStore';
import { UserRole } from '@/typing/enum';
import type { Annotation } from '@/typing/annotation';

type ProjectForm = {
  name: string;
  description?: string;
};

const AnnotationProjectListPage: FC = () => {
  const { annotationApi } = useApi();
  const { message, modal } = App.useApp();
  const nav = useNavigate();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === UserRole.Admin;
  const [list, setList] = useState<Annotation.Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const searchRef = useRef<string | undefined>(undefined);

  const fetchData = useCallback(
    (params: PaginationParams) =>
      annotationApi.getProjectList({
        ...params,
        name: searchRef.current,
      }),
    [annotationApi],
  );
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData,
    setData: setList,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Annotation.Project>();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ProjectForm>();

  const openCreate = useCallback(() => {
    setEditing(undefined);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record: Annotation.Project) => {
      setEditing(record);
      form.setFieldsValue({
        name: record.name,
        description: record.description,
      });
      setOpen(true);
    },
    [form],
  );

  const onDelete = useCallback(
    (record: Annotation.Project) => {
      if (!isAdmin && record.libraries.length > 0) {
        message.warning('不允许删除，请先清空项目中的数据集');
        return;
      }
      if (isAdmin && record.libraries.length > 0) {
        message.warning('请先逐个清理项目中的数据集后再删除项目');
        return;
      }
      modal.confirm({
        title: '确认删除项目',
        content: `确认删除项目「${record.name}」吗？`,
        onOk: async () => {
          const res = await annotationApi.deleteProject(record.uid);
          if (res.code === 200) {
            message.success('删除成功');
            refresh();
          } else {
            message.error(res.message || '删除失败');
          }
        },
      });
    },
    [annotationApi, isAdmin, message, modal, refresh],
  );

  const onSave = useCallback(
    async (values: ProjectForm) => {
      setSaving(true);
      try {
        const payload = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        };
        const res = editing
          ? await annotationApi.updateProject({
              uid: editing.uid,
              ...payload,
            })
          : await annotationApi.createProject(payload);
        if (res.code === 200) {
          message.success(editing ? '更新成功' : '创建成功');
          setOpen(false);
          form.resetFields();
          refresh();
        } else {
          message.error(res.message || '保存失败');
        }
      } finally {
        setSaving(false);
      }
    },
    [annotationApi, editing, form, message, refresh],
  );

  return (
    <ContentLayout
      title="数据标注项目"
      action={
        <Button type="primary" onClick={openCreate}>
          新建项目
        </Button>
      }
    >
      <Card className="mb-[16px]">
        <div className="flex items-center justify-between gap-[12px]">
          <Input
            className="max-w-[360px]"
            placeholder="按项目名称搜索"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="flex items-center gap-[8px]">
            <Button
              type="primary"
              onClick={() => {
                searchRef.current = keyword.trim() || undefined;
                refresh();
              }}
            >
              查询
            </Button>
            <Button
              onClick={() => {
                setKeyword('');
                searchRef.current = undefined;
                refresh();
              }}
            >
              重置
            </Button>
          </div>
        </div>
      </Card>

      {list.length < 1 ? (
        <div className="h-[300px] flex items-center justify-center">
          <Empty description="暂无数据标注项目" />
        </div>
      ) : (
        <Flex wrap="wrap" gap="20px">
          {list.map((item) => (
            <Card
              key={item.uid}
              className="min-w-[360px] w-[calc((100%_-_20px_-_20px)_/_3)]"
              actions={[
                <Button
                  key="detail"
                  type="link"
                  onClick={() => nav(`/annotation/project/detail/${item.uid}`)}
                >
                  查看详情
                </Button>,
                <Button key="edit" type="link" onClick={() => openEdit(item)}>
                  编辑
                </Button>,
                <Button
                  key="delete"
                  type="link"
                  danger
                  onClick={() => onDelete(item)}
                >
                  删除
                </Button>,
              ]}
            >
              <Typography.Title level={5} className="!mb-[8px]">
                {item.name}
              </Typography.Title>
              <p className="text-fg-tertiary min-h-[44px]">
                {item.description || '暂无描述'}
              </p>
              <p className="text-fg-tertiary mt-[8px]">
                专病库数量：
                <span className="text-fg-primary">{item.libraries.length}</span>
              </p>
              <p className="text-fg-tertiary mt-[8px]">
                创建人：
                <span className="text-fg-primary ml-[4px]">
                  {item.creator_name || item.creator}
                </span>
              </p>
              <p className="text-fg-tertiary mt-[8px]">
                更新时间：
                <span className="text-fg-primary ml-[4px]">
                  {item.updated_at
                    ? dayjs(item.updated_at).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </span>
              </p>
            </Card>
          ))}
        </Flex>
      )}

      <div className="flex justify-end mt-[16px]">
        <PaginationComponent />
      </div>

      <Modal
        centered
        open={open}
        title={editing ? '编辑项目' : '新建项目'}
        onCancel={() => setOpen(false)}
        onOk={form.submit}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form<ProjectForm>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSave}
          autoComplete="off"
        >
          <Form.Item<ProjectForm>
            label="项目名称"
            name="name"
            rules={[
              { required: true, message: '请输入项目名称' },
              { whitespace: true, message: '项目名称不能为空' },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item<ProjectForm> label="项目描述" name="description">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ContentLayout>
  );
};

export default AnnotationProjectListPage;
