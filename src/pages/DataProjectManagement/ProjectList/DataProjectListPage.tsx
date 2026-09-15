import { App, Button, Card, Form, Input, Modal, Table } from 'antd';
import dayjs from 'dayjs';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import type { DataProject } from '@/typing/dataProject';

type SearchFormValues = {
  name?: string;
};

type ProjectFormValues = {
  name: string;
  doris_database?: string;
  comment?: string;
};

const DataProjectListPage: FC = () => {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const { dataProjectApi } = useApi();

  const [list, setList] = useState<DataProject.List>([]);

  const searchParams = useRef<Pick<DataProject.ListParams, 'name'>>({
    name: undefined,
  });

  const fetchData = useCallback(
    async (params: PaginationParams) =>
      dataProjectApi.getList({ ...params, ...searchParams.current }),
    [dataProjectApi],
  );

  const { PaginationComponent, refresh } = usePaginationData({
    fetchData,
    setData: setList,
  });

  const [form] = Form.useForm<ProjectFormValues>();
  const [open, setOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string>();
  const [saving, setSaving] = useState(false);

  const modalTitle = useMemo(
    () => (editingUid ? '编辑数据项目' : '新建数据项目'),
    [editingUid],
  );

  const openCreate = useCallback(() => {
    setEditingUid(undefined);
    form.resetFields();
    setOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (record: DataProject.Item) => {
      setEditingUid(record.uid);
      form.setFieldsValue({
        name: record.name,
        doris_database: record.doris_database,
        comment: record.comment,
      });
      setOpen(true);
    },
    [form],
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditingUid(undefined);
    form.resetFields();
  }, [form]);

  const onSave = useCallback(
    async (values: ProjectFormValues) => {
      setSaving(true);
      try {
        const name = values.name.trim();
        if (!name) {
          message.error('请输入项目名称');
          return;
        }
        const comment = values.comment?.trim() || undefined;
        const database = values.doris_database?.trim() || undefined;

        const res = editingUid
          ? await dataProjectApi.update({ uid: editingUid, name, comment })
          : await dataProjectApi.create({
              name,
              doris_database: database,
              comment,
            });

        if (res.code === 200) {
          message.success(editingUid ? '更新成功' : '创建成功');
          closeModal();
          refresh();
        } else {
          message.error(res.message || '保存失败');
        }
      } catch (e) {
        console.error('保存数据项目失败:', e);
        message.error('保存失败，请稍后重试');
      } finally {
        setSaving(false);
      }
    },
    [closeModal, dataProjectApi, editingUid, message, refresh],
  );

  const onDelete = useCallback(
    (record: DataProject.Item) => {
      modal.confirm({
        title: '确认删除数据项目',
        content: `确认删除「${record.name}」吗？项目下的视图会一并删除（Doris 数据库本身不会被删除）。`,
        onOk: async () => {
          const res = await dataProjectApi.delete(record.uid);
          if (res.code === 200) {
            message.success('删除成功');
            refresh();
          } else {
            message.error(res.message || '删除失败');
          }
        },
      });
    },
    [dataProjectApi, message, modal, refresh],
  );

  const onSearch = useCallback(
    (values: SearchFormValues) => {
      searchParams.current.name = values.name?.trim() || undefined;
      refresh();
    },
    [refresh],
  );

  return (
    <ContentLayout
      title="数据项目"
      action={
        <Button type="primary" onClick={openCreate}>
          新建项目
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
                label="项目名称"
                name="name"
                className="min-w-[256px]"
              >
                <Input placeholder="输入项目名称" allowClear />
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
          <Table<DataProject.Item>
            dataSource={list}
            rowKey="uid"
            pagination={false}
            onRow={(_, i) => ({
              className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
            })}
          >
            <Table.Column title="项目名称" dataIndex="name" />
            <Table.Column
              title="Doris 数据库"
              dataIndex="doris_database"
              width={200}
            />
            <Table.Column
              title="描述"
              dataIndex="comment"
              render={(comment?: string) => comment || '-'}
            />
            <Table.Column
              title="创建人"
              dataIndex="creator_name"
              width={120}
              render={(name?: string) => name || '-'}
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
              width={200}
              render={(_, record: DataProject.Item) => (
                <div className="flex">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => nav(`/data_project/detail/${record.uid}`)}
                  >
                    详情
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
        <Form<ProjectFormValues>
          form={form}
          layout="vertical"
          onFinish={onSave}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item<ProjectFormValues>
            label="项目名称"
            name="name"
            rules={[
              { required: true, message: '请输入项目名称' },
              { whitespace: true, message: '项目名称不能为空' },
            ]}
          >
            <Input maxLength={80} />
          </Form.Item>

          {editingUid ? (
            <Form.Item<ProjectFormValues>
              label="Doris 数据库"
              name="doris_database"
            >
              <Input disabled />
            </Form.Item>
          ) : (
            <Form.Item<ProjectFormValues>
              label="Doris 数据库名"
              name="doris_database"
              tooltip="系统会在 Doris 中自动创建该数据库；绑定后不可修改"
              rules={[
                {
                  pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                  message: '仅支持字母、数字和下划线，且不以数字开头',
                },
              ]}
            >
              <Input
                placeholder="留空则根据项目名称自动生成，仅字母、数字、下划线"
                maxLength={64}
              />
            </Form.Item>
          )}

          <Form.Item<ProjectFormValues> label="描述" name="comment">
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

export default DataProjectListPage;
