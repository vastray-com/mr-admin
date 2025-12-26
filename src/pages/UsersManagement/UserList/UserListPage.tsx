import { App, Button, Card, Form, Input, Modal, Table, Tag } from 'antd';
import { useCallback, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { UserRole } from '@/typing/enum';
import type { AxiosError } from 'axios';
import type { User } from '@/typing/user';

const UserListPage = () => {
  const { userApi } = useApi();
  const { message } = App.useApp();

  // 拉取列表分页数据
  const [data, setData] = useState<User.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: userApi.getList,
    setData: setData,
  });

  // 新建用户
  const [form] = Form.useForm<User.CreateParams>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const onCreate = () => {
    form.resetFields();
    setShowCreateModal(true);
  };

  // const onAction = useCallback(
  //   (uid: string, action: Task.ActionParams['action']) => {
  //     console.log(`执行操作：${action}，任务 ID：${uid}`);
  //     taskApi
  //       .actionTask({ uid, action })
  //       .then((res) => {
  //         if (res.code === 200) {
  //           message.success(`操作成功`);
  //           // 刷新任务列表
  //           refresh();
  //         } else {
  //           message.error(`操作失败：${res.message}`);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error(`操作任务失败：`, err);
  //         message.error('操作任务失败，请稍后重试');
  //       });
  //   },
  //   [taskApi, refresh, message.error, message.success],
  // );

  const onFinish = useCallback(
    async (values: User.CreateParams) => {
      console.log('提交的新用户数据：', values);
      try {
        const res = await userApi.create(values);
        if (res.code === 200) {
          message.success('用户创建成功');
          setShowCreateModal(false);
          form.resetFields();
          // 刷新任务列表
          refresh();
        } else {
          message.error(`创建用户失败：${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('创建用户失败：', e);
        message.error(`创建用户失败: ${e.response?.data.message || e.message}`);
      }
    },
    [userApi, refresh, form.resetFields, message],
  );

  return (
    <>
      <ContentLayout
        title="用户列表"
        action={
          <Button type="primary" className="ml-[8px]" onClick={onCreate}>
            新建用户
          </Button>
        }
      >
        <Card>
          <Table<User.User> dataSource={data} rowKey="uid" pagination={false}>
            <Table.Column title="用户ID" dataIndex="uid" />
            <Table.Column title="用户名" dataIndex="username" />
            <Table.Column title="昵称" dataIndex="nickname" />
            <Table.Column
              title="角色"
              dataIndex="role_name"
              render={(_, r: User.User) => {
                switch (r.role) {
                  case UserRole.Admin:
                    return <Tag color="blue">{r.role_name}</Tag>;
                  case UserRole.User:
                    return <Tag>{r.role_name}</Tag>;
                  default:
                    return <Tag>未知角色</Tag>;
                }
              }}
            />
            {/*<Table.Column*/}
            {/*  title="操作"*/}
            {/*  key="action"*/}
            {/*  width={280}*/}
            {/*  render={(_, record: Task.Item) => (*/}
            {/*    <>*/}
            {/*      <Button type="link" onClick={() => onCopy(record)}>*/}
            {/*        复制*/}
            {/*      </Button>*/}
            {/*      <Link to={`/tasks_management/tasks/detail/${record.uid}`}>*/}
            {/*        <Button type="link">详情</Button>*/}
            {/*      </Link>{' '}*/}
            {/*      {record.one_time_task_type !== OneTimeTaskType.Immediate &&*/}
            {/*        (record.status === TaskStatus.Disabled ? (*/}
            {/*          <Button*/}
            {/*            type="link"*/}
            {/*            onClick={() => onAction(record.uid, 'enable')}*/}
            {/*          >*/}
            {/*            启用*/}
            {/*          </Button>*/}
            {/*        ) : (*/}
            {/*          <Button*/}
            {/*            type="link"*/}
            {/*            onClick={() => onAction(record.uid, 'disable')}*/}
            {/*          >*/}
            {/*            禁用*/}
            {/*          </Button>*/}
            {/*        ))}{' '}*/}
            {/*      {(record.status === TaskStatus.Disabled ||*/}
            {/*        record.one_time_task_type ===*/}
            {/*          OneTimeTaskType.Immediate) && (*/}
            {/*        <Button*/}
            {/*          type="link"*/}
            {/*          danger*/}
            {/*          onClick={() => onAction(record.uid, 'delete')}*/}
            {/*        >*/}
            {/*          删除*/}
            {/*        </Button>*/}
            {/*      )}*/}
            {/*    </>*/}
            {/*  )}*/}
            {/*/>*/}
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
        title="新建用户"
        width={830}
        footer={null}
      >
        <Form<User.CreateParams>
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
          <Form.Item<User.CreateParams>
            label="用户名"
            name="username"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '用户名不能为空',
              },
            ]}
          >
            <Input placeholder="输入用户名" />
          </Form.Item>

          <Form.Item<User.CreateParams> label="昵称" name="nickname">
            <Input placeholder="输入昵称" />
          </Form.Item>

          <Form.Item<User.CreateParams>
            label="密码"
            name="password"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '密码不能为空',
              },
            ]}
          >
            <Input.Password placeholder="输入密码" />
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

export default UserListPage;
