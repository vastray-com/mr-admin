import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { useUserStore } from '@/store/useUserStore';
import { UserRole } from '@/typing/enum';
import type { Annotation } from '@/typing/annotation';

type LibraryForm = {
  dataset_uid: string;
  name: string;
  description?: string;
};

type EditLibraryForm = {
  name: string;
  description?: string;
};

const AnnotationProjectDetailPage: FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const nav = useNavigate();
  const { annotationApi } = useApi();
  const { message, modal } = App.useApp();
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === UserRole.Admin;

  const [detail, setDetail] = useState<Annotation.Project | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchDetail = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await annotationApi.getProjectDetail(uid);
      if (res.code === 200) {
        setDetail(res.data);
      } else {
        message.error(res.message || '获取详情失败');
      }
    } finally {
      setLoading(false);
    }
  }, [annotationApi, message, uid]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onDeleteProject = useCallback(() => {
    if (!detail) return;
    if (!isAdmin && detail.libraries.length > 0) {
      message.warning('不允许删除，请先清空项目中的数据集');
      return;
    }
    if (isAdmin && detail.libraries.length > 0) {
      message.warning('请先逐个清理项目中的数据集后再删除项目');
      return;
    }
    modal.confirm({
      title: '确认删除项目',
      content: `确认删除项目「${detail.name}」吗？`,
      onOk: async () => {
        const res = await annotationApi.deleteProject(detail.uid);
        if (res.code === 200) {
          message.success('删除成功');
          nav('/annotation/project/list');
        } else {
          message.error(res.message || '删除失败');
        }
      },
    });
  }, [annotationApi, detail, isAdmin, message, modal, nav]);

  const [importOpen, setImportOpen] = useState(false);
  const [importOptions, setImportOptions] = useState<
    Annotation.ImportableDatasetOption[]
  >([]);
  const [importSaving, setImportSaving] = useState(false);
  const [importForm] = Form.useForm<LibraryForm>();

  const loadDatasetOptions = useCallback(async () => {
    const res = await annotationApi.getImportableDatasets();
    if (res.code === 200) {
      setImportOptions(res.data);
    }
  }, [annotationApi]);

  const openImport = useCallback(async () => {
    importForm.resetFields();
    await loadDatasetOptions();
    setImportOpen(true);
  }, [importForm, loadDatasetOptions]);

  const onImport = useCallback(
    async (values: LibraryForm) => {
      if (!uid) return;
      setImportSaving(true);
      try {
        const res = await annotationApi.importLibrary({
          project_uid: uid,
          dataset_uid: values.dataset_uid,
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        });
        if (res.code === 200) {
          message.success('导入成功');
          setImportOpen(false);
          fetchDetail();
        } else {
          message.error(res.message || '导入失败');
        }
      } finally {
        setImportSaving(false);
      }
    },
    [annotationApi, fetchDetail, message, uid],
  );

  const [editingLibrary, setEditingLibrary] = useState<Annotation.Library>();
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm] = Form.useForm<EditLibraryForm>();
  const openEditLibrary = useCallback(
    (lib: Annotation.Library) => {
      setEditingLibrary(lib);
      editForm.setFieldsValue({
        name: lib.name,
        description: lib.description,
      });
      setEditOpen(true);
    },
    [editForm],
  );

  const onEditLibrary = useCallback(
    async (values: EditLibraryForm) => {
      if (!editingLibrary || !uid) return;
      setEditSaving(true);
      try {
        const res = await annotationApi.updateLibrary({
          project_uid: uid,
          library_uid: editingLibrary.uid,
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
        });
        if (res.code === 200) {
          message.success('更新成功');
          setEditOpen(false);
          fetchDetail();
        } else {
          message.error(res.message || '更新失败');
        }
      } finally {
        setEditSaving(false);
      }
    },
    [annotationApi, editingLibrary, fetchDetail, message, uid],
  );

  const onDeleteLibrary = useCallback(
    (lib: Annotation.Library) => {
      if (!isAdmin) {
        message.warning('普通用户不允许删除数据集');
        return;
      }
      modal.confirm({
        title: '确认删除数据集',
        content: `确认删除「${lib.name}」吗？`,
        onOk: async () => {
          if (!uid) return;
          const res = await annotationApi.deleteLibrary({
            project_uid: uid,
            library_uid: lib.uid,
          });
          if (res.code === 200) {
            message.success('删除成功');
            fetchDetail();
          } else {
            message.error(res.message || '删除失败');
          }
        },
      });
    },
    [annotationApi, fetchDetail, isAdmin, message, modal, uid],
  );

  const onExportLibrary = useCallback(
    async (lib: Annotation.Library) => {
      if (!uid) return;
      const loadingKey = `exp-${lib.uid}`;
      message.loading({ key: loadingKey, content: '正在导出...', duration: 0 });
      try {
        const res = await annotationApi.exportLibrary({
          project_uid: uid,
          library_uid: lib.uid,
        });
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lib.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        message.success({ key: loadingKey, content: '导出成功' });
      } catch {
        message.error({ key: loadingKey, content: '导出失败' });
      }
    },
    [annotationApi, message, uid],
  );

  const projectInfo = useMemo(() => {
    if (!detail) return null;
    return [
      { key: 'name', label: '项目名称', children: detail.name },
      { key: 'desc', label: '项目描述', children: detail.description || '-' },
      {
        key: 'creator',
        label: '创建人',
        children: detail.creator_name || detail.creator,
      },
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

  if (loading || !detail) {
    return (
      <div className="h-full flex items-center justify-center gap-[8px]">
        <Spin />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <ContentLayout
      title="数据标注项目详情"
      action={
        <div className="flex gap-[8px]">
          <Button onClick={openImport} type="primary">
            导入数据集
          </Button>
          <Button danger onClick={onDeleteProject}>
            删除项目
          </Button>
        </div>
      }
    >
      <Card title="项目信息">
        <Descriptions
          bordered
          size="small"
          column={4}
          items={projectInfo ?? []}
        />
      </Card>

      <Card className="mt-[16px]" title="专病库列表">
        {detail.libraries.length < 1 ? (
          <Empty description="暂无专病库，请先导入数据集" />
        ) : (
          <Flex wrap="wrap" gap="16px">
            {detail.libraries.map((lib) => (
              <Card
                key={lib.uid}
                className="min-w-[320px] w-[calc((100%_-_16px_-_16px)_/_3)]"
                actions={[
                  <Button
                    key="detail"
                    type="link"
                    onClick={() =>
                      nav(`/annotation/library/detail/${detail.uid}/${lib.uid}`)
                    }
                  >
                    打开标注
                  </Button>,
                  <Button
                    key="edit"
                    type="link"
                    onClick={() => openEditLibrary(lib)}
                  >
                    编辑
                  </Button>,
                  <Button
                    key="export"
                    type="link"
                    onClick={() => onExportLibrary(lib)}
                  >
                    导出 CSV
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    danger
                    disabled={!isAdmin}
                    onClick={() => onDeleteLibrary(lib)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <Typography.Title level={5} className="!mb-[8px]">
                  {lib.name}
                </Typography.Title>
                <p className="text-fg-tertiary min-h-[44px]">
                  {lib.description || '暂无描述'}
                </p>
                <p className="text-fg-tertiary mt-[8px]">
                  数据条数：
                  <span className="text-fg-primary">{lib.row_count}</span>
                </p>
              </Card>
            ))}
          </Flex>
        )}
      </Card>

      <Modal
        centered
        open={importOpen}
        title="导入数据集为专病库"
        onCancel={() => setImportOpen(false)}
        onOk={importForm.submit}
        confirmLoading={importSaving}
        destroyOnHidden
      >
        <Form<LibraryForm>
          form={importForm}
          layout="vertical"
          requiredMark={false}
          onFinish={onImport}
        >
          <Form.Item<LibraryForm>
            label="来源数据集"
            name="dataset_uid"
            rules={[{ required: true, message: '请选择来源数据集' }]}
          >
            <Select
              options={importOptions.map((x) => ({
                label: `${x.name_cn} (${x.uid})`,
                value: x.uid,
              }))}
              showSearch
            />
          </Form.Item>
          <Form.Item<LibraryForm>
            label="专病库名称"
            name="name"
            rules={[
              { required: true, message: '请输入专病库名称' },
              { whitespace: true, message: '专病库名称不能为空' },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item<LibraryForm> label="专病库描述" name="description">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        centered
        open={editOpen}
        title="编辑专病库"
        onCancel={() => setEditOpen(false)}
        onOk={editForm.submit}
        confirmLoading={editSaving}
        destroyOnHidden
      >
        <Form<EditLibraryForm>
          form={editForm}
          layout="vertical"
          requiredMark={false}
          onFinish={onEditLibrary}
        >
          <Form.Item<EditLibraryForm>
            label="专病库名称"
            name="name"
            rules={[
              { required: true, message: '请输入专病库名称' },
              { whitespace: true, message: '专病库名称不能为空' },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item<EditLibraryForm> label="专病库描述" name="description">
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

export default AnnotationProjectDetailPage;
