import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import type { DownloadTemplate } from '@/typing/downloadTemplate';

type SearchFormValues = {
  name?: string;
  tag?: string;
};

type TemplateFormValues = {
  name: string;
  comment?: string;
  tag?: string;
};

const DownloadTemplatePage: FC = () => {
  const { message, modal } = App.useApp();
  const { downloadTemplateApi } = useApi();

  const [list, setList] = useState<DownloadTemplate.List>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  const searchParams = useRef<
    Pick<DownloadTemplate.ListParams, 'name' | 'tag'>
  >({
    name: undefined,
    tag: undefined,
  });

  const fetchTagOptions = useCallback(async () => {
    try {
      const res = await downloadTemplateApi.getTags();
      if (res.code === 200) {
        setTagOptions(res.data);
      }
    } catch (e) {
      console.error('拉取模板标签失败:', e);
    }
  }, [downloadTemplateApi]);

  useEffect(() => {
    fetchTagOptions();
  }, [fetchTagOptions]);

  const fetchData = useCallback(
    async (params: PaginationParams) =>
      downloadTemplateApi.getTemplateList({
        ...params,
        ...searchParams.current,
      }),
    [downloadTemplateApi],
  );

  const { PaginationComponent, refresh } = usePaginationData({
    fetchData,
    setData: (rows) => {
      setList(rows);
      const set = new Set(tagOptions);
      rows.forEach((row) => {
        if (row.tag) {
          set.add(row.tag);
        }
      });
      setTagOptions(Array.from(set).sort());
    },
  });

  const [form] = Form.useForm<TemplateFormValues>();
  const [open, setOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>();
  const [persistedFileName, setPersistedFileName] = useState<string>();
  const uploadedBase64Ref = useRef<string | undefined>(undefined);

  const modalTitle = useMemo(
    () => (editingUid ? '编辑下载模板' : '新建下载模板'),
    [editingUid],
  );

  const openCreate = useCallback(() => {
    setEditingUid(undefined);
    uploadedBase64Ref.current = undefined;
    setUploadedFileName(undefined);
    setPersistedFileName(undefined);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    async (record: DownloadTemplate.Item) => {
      setEditingUid(record.uid);
      uploadedBase64Ref.current = undefined;
      setUploadedFileName(undefined);
      setPersistedFileName(record.file_name);
      form.setFieldsValue({
        name: record.name,
        comment: record.comment,
        tag: record.tag,
      });
      setOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditingUid(undefined);
    uploadedBase64Ref.current = undefined;
    setUploadedFileName(undefined);
    setPersistedFileName(undefined);
    form.resetFields();
  }, [form]);

  const readFileAsBase64 = useCallback(async (file: File) => {
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const val = String(reader.result ?? '');
        const payload = val.includes(',') ? val.split(',')[1] : val;
        resolve(payload);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return content;
  }, []);

  const onBeforeUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        message.error('仅支持上传 .xlsx 文件');
        return Upload.LIST_IGNORE;
      }
      setUploading(true);
      try {
        const content = await readFileAsBase64(file);
        uploadedBase64Ref.current = content;
        setUploadedFileName(file.name);
        setPersistedFileName(file.name);
        message.success('模板文件已读取');
      } catch (e) {
        console.error('读取模板文件失败:', e);
        message.error('读取模板文件失败，请重试');
      } finally {
        setUploading(false);
      }
      return false;
    },
    [form, message, readFileAsBase64],
  );

  const onDelete = useCallback(
    (record: DownloadTemplate.Item) => {
      modal.confirm({
        title: '确认删除',
        content: `确认删除模板「${record.name}」吗？`,
        onOk: async () => {
          const res = await downloadTemplateApi.deleteTemplate(record.uid);
          if (res.code === 200) {
            message.success('删除成功');
            refresh();
            fetchTagOptions();
          } else {
            message.error(res.message || '删除失败');
          }
        },
      });
    },
    [downloadTemplateApi, fetchTagOptions, message, modal, refresh],
  );

  const onDownloadTemplate = useCallback(
    async (record: DownloadTemplate.Item) => {
      const msgKey = `download-template-${record.uid}`;
      message.loading({ key: msgKey, content: '正在下载模板...', duration: 0 });
      try {
        const res = await downloadTemplateApi.getTemplateDetail(record.uid);
        if (res.code !== 200 || !res.data.content_base64) {
          message.error({
            key: msgKey,
            content: res.message || '模板内容为空',
          });
          return;
        }

        const binary = atob(res.data.content_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const fileName = (res.data.file_name || `${res.data.name}.xlsx`).trim();

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName.toLowerCase().endsWith('.xlsx')
          ? fileName
          : `${fileName}.xlsx`;
        anchor.click();
        URL.revokeObjectURL(url);
        anchor.remove();

        message.success({ key: msgKey, content: '模板下载成功' });
      } catch (e) {
        console.error('下载模板失败:', e);
        message.error({ key: msgKey, content: '下载模板失败，请稍后重试' });
      }
    },
    [downloadTemplateApi, message],
  );

  const onSave = useCallback(
    async (values: TemplateFormValues) => {
      setSaving(true);
      try {
        const singleTag = values.tag?.trim() || undefined;
        const resolvedFileName = (
          uploadedFileName ||
          persistedFileName ||
          ''
        ).trim();

        if (!editingUid && !uploadedBase64Ref.current) {
          message.error('新建模板时必须上传文件');
          return;
        }
        if (!resolvedFileName) {
          message.error('模板文件名为空，请重新上传模板文件');
          return;
        }

        const payloadBase = {
          name: values.name.trim(),
          file_name: resolvedFileName,
          comment: values.comment?.trim() || undefined,
          tag: singleTag,
        };

        const res = editingUid
          ? await downloadTemplateApi.updateTemplate({
              uid: editingUid,
              ...payloadBase,
              content_base64: uploadedBase64Ref.current,
            })
          : await downloadTemplateApi.createTemplate({
              ...payloadBase,
              content_base64: uploadedBase64Ref.current as string,
            });

        if (res.code === 200) {
          message.success(editingUid ? '更新成功' : '创建成功');
          closeModal();
          refresh();
          fetchTagOptions();
        } else {
          message.error(res.message || '保存失败');
        }
      } catch (e) {
        console.error('保存模板失败:', e);
        message.error('保存失败，请稍后重试');
      } finally {
        setSaving(false);
      }
    },
    [
      closeModal,
      downloadTemplateApi,
      editingUid,
      fetchTagOptions,
      message,
      refresh,
      persistedFileName,
      uploadedFileName,
    ],
  );

  const onSearch = useCallback(
    (values: SearchFormValues) => {
      searchParams.current.name = values.name?.trim() || undefined;
      searchParams.current.tag = values.tag || undefined;
      refresh();
    },
    [refresh],
  );

  return (
    <ContentLayout
      title="下载模板管理"
      action={
        <Button type="primary" onClick={openCreate}>
          新建模板
        </Button>
      }
    >
      <div className="h-full">
        <Card className="h-[80px]">
          <Form<SearchFormValues>
            layout="inline"
            className="flex items-center justify-between"
            onFinish={onSearch}
          >
            <div className="flex items-center gap-[16px]">
              <Form.Item<SearchFormValues>
                label="模板名称"
                name="name"
                className="min-w-[256px]"
              >
                <Input placeholder="输入模板名称" allowClear />
              </Form.Item>

              <Form.Item<SearchFormValues>
                label="标签"
                name="tag"
                className="min-w-[256px]"
              >
                <Select
                  placeholder="按标签筛选"
                  options={tagOptions.map((tag) => ({
                    label: tag,
                    value: tag,
                  }))}
                  allowClear
                />
              </Form.Item>
            </div>

            <Form.Item noStyle>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card className="h-[calc(100%_-_80px_-_16px)] mt-[16px]">
          <Table<DownloadTemplate.Item>
            dataSource={list}
            rowKey="uid"
            pagination={false}
            onRow={(_, i) => ({
              className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
            })}
          >
            <Table.Column title="模板 ID" dataIndex="uid" width={220} />
            <Table.Column title="模板名称" dataIndex="name" />
            <Table.Column title="文件名" dataIndex="file_name" />
            <Table.Column
              title="标签"
              dataIndex="tag"
              render={(tag?: string) => (tag ? <Tag>{tag}</Tag> : '-')}
            />
            <Table.Column title="备注" dataIndex="comment" />
            <Table.Column title="创建人" dataIndex="creator_name" width={120} />
            <Table.Column
              title="更新时间"
              dataIndex="updated_at"
              width={180}
              render={(time: string) =>
                dayjs(time).format('YYYY-MM-DD HH:mm:ss')
              }
            />
            <Table.Column
              title="操作"
              key="action"
              width={220}
              render={(_, record: DownloadTemplate.Item) => (
                <div className="flex">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => onDownloadTemplate(record)}
                  >
                    下载
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => openEdit(record)}
                  >
                    编辑
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => onDelete(record)}
                  >
                    删除
                  </Button>
                </div>
              )}
            />
          </Table>

          <div className="flex justify-end mt-[16px]">
            <PaginationComponent />
          </div>
        </Card>
      </div>

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
        <Form<TemplateFormValues>
          form={form}
          layout="vertical"
          onFinish={onSave}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item<TemplateFormValues>
            label="模板名称"
            name="name"
            rules={[
              { required: true, message: '请输入模板名称' },
              { whitespace: true, message: '模板名称不能为空' },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>

          <Form.Item<TemplateFormValues> label="标签" name="tag">
            <Input placeholder="请输入单个标签" maxLength={64} />
          </Form.Item>

          <Form.Item<TemplateFormValues> label="备注" name="comment">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={300}
            />
          </Form.Item>

          <Form.Item label="模板文件(.xlsx)">
            <Upload
              accept=".xlsx"
              beforeUpload={onBeforeUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button loading={uploading}>选择文件</Button>
            </Upload>
            <div className="text-[12px] text-[#666] mt-[6px]">
              {uploadedFileName
                ? `已选择文件：${uploadedFileName}`
                : editingUid
                  ? '未选择新文件时将沿用原模板内容'
                  : '请上传模板文件'}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </ContentLayout>
  );
};

export default DownloadTemplatePage;
