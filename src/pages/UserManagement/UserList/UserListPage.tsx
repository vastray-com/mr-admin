import { App, Button, Card, Form, Input, Modal, Table, Tag } from 'antd';
import { type FC, useCallback, useEffect, useState } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { useApi } from '@/hooks/useApi';
import { usePaginationData } from '@/hooks/usePaginationData';
import { UserRole } from '@/typing/enum';
import type { AxiosError } from 'axios';
import type { User } from '@/typing/user';

const UserListPage = () => {
  const { userApi } = useApi();

  // 拉取列表分页数据
  const [data, setData] = useState<User.List>([]);
  const { PaginationComponent, refresh } = usePaginationData({
    fetchData: userApi.getList,
    setData: setData,
  });

  // 新建用户
  const [showCreateModal, setShowCreateModal] = useState(false);
  // 批量新建用户
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);
  // 重置用户密码
  const [resetUserPwd, setResetUserPwd] = useState<User.User | null>(null);

  return (
    <>
      <ContentLayout
        title="用户列表"
        action={
          <>
            <Button
              type="primary"
              className="ml-[8px]"
              onClick={() => setShowCreateModal(true)}
            >
              新建用户
            </Button>
            <Button
              className="ml-[8px]"
              onClick={() => setShowBatchCreateModal(true)}
            >
              批量新建用户
            </Button>
          </>
        }
      >
        <Card>
          <Table<User.User>
            dataSource={data}
            rowKey="uid"
            pagination={false}
            onRow={(_, i) => ({
              className: i && i % 2 === 1 ? 'bg-[#fafafa]' : '',
            })}
          >
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
            <Table.Column
              title="操作"
              key="action"
              width={280}
              render={(_, record: User.User) => (
                <>
                  <Button type="link" onClick={() => setResetUserPwd(record)}>
                    重置密码
                  </Button>
                </>
              )}
            />
          </Table>

          <div className="mt-[20px] flex justify-end">
            <PaginationComponent />
          </div>
        </Card>
      </ContentLayout>

      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onFinish={() => refresh()}
      />

      <BatchCreateUserModal
        open={showBatchCreateModal}
        onClose={() => setShowBatchCreateModal(false)}
        onFinish={() => refresh()}
      />

      <ResetPwdModal
        user={resetUserPwd}
        onClose={() => setResetUserPwd(null)}
        onFinish={() => refresh()}
      />
    </>
  );
};

export default UserListPage;

type CreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
};
const CreateUserModal: FC<CreateUserModalProps> = ({
  open,
  onClose,
  onFinish,
}) => {
  const { userApi } = useApi();
  const { message } = App.useApp();

  // 新建用户
  const [form] = Form.useForm<User.CreateParams>();
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open]);
  const _onFinish = useCallback(
    async (values: User.CreateParams) => {
      console.log('提交的新用户数据：', values);
      try {
        const res = await userApi.create(values);
        if (res.code === 200) {
          message.success('用户创建成功');
          onClose();
          onFinish?.();
          form.resetFields();
        } else {
          message.error(`创建用户失败：${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('创建用户失败：', e);
        message.error(`创建用户失败: ${e.response?.data.message || e.message}`);
      }
    },
    [userApi, form.resetFields, message],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="新建用户"
      width={830}
      footer={null}
    >
      <Form<User.CreateParams>
        className="mt-[36px]"
        form={form}
        name="create-user-form"
        onFinish={_onFinish}
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
  );
};

type BatchCreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
};
const BatchCreateUserModal: FC<BatchCreateUserModalProps> = ({
  open,
  onClose,
  onFinish,
}) => {
  const { userApi } = useApi();
  const { message } = App.useApp();

  // 新建用户
  const [form] = Form.useForm<User.BatchCreateParamsFE>();
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open]);
  const _onFinish = useCallback(
    async (values: User.BatchCreateParamsFE) => {
      console.log('提交的新用户数据：', values);
      try {
        const usernameList = values.usernames
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        const usernames: string[] = [];
        for (const username of usernameList) {
          if (usernames.includes(username)) {
            message.error(`用户名 "${username}" 重复，请检查输入`);
            return;
          } else {
            usernames.push(username);
          }
        }
        if (usernames.length === 0) {
          message.error('请至少输入一个有效的用户名');
          return;
        }
        const res = await userApi.batchCreate({ ...values, usernames });
        if (res.code === 200) {
          message.success('用户创建成功');
          onClose();
          onFinish?.();
          form.resetFields();
        } else {
          message.error(`创建用户失败：${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('创建用户失败：', e);
        message.error(`创建用户失败: ${e.response?.data.message || e.message}`);
      }
    },
    [userApi, form.resetFields, message],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      open={open}
      title="批量新建用户"
      width={830}
      footer={null}
    >
      <Form<User.BatchCreateParamsFE>
        className="mt-[36px]"
        form={form}
        name="batch-create-user-form"
        onFinish={_onFinish}
        onFinishFailed={(v) => {
          console.log('表单提交失败：', v);
        }}
        autoComplete="off"
        labelCol={{ span: 4 }}
      >
        <Form.Item<User.BatchCreateParamsFE>
          label="用户名"
          name="usernames"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '用户名不能为空',
            },
          ]}
        >
          <Input.TextArea
            placeholder="输入用户名，每行一个"
            autoSize={{ minRows: 4, maxRows: 10 }}
          />
        </Form.Item>

        <Form.Item<User.BatchCreateParamsFE>
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
  );
};

type ResetPwdModalProps = {
  user: User.User | null;
  onClose: () => void;
  onFinish?: () => void;
};
const ResetPwdModal: FC<ResetPwdModalProps> = ({ user, onClose, onFinish }) => {
  const { userApi } = useApi();
  const { message } = App.useApp();

  // 新建用户
  const [form] = Form.useForm<User.ResetPwdParams>();
  useEffect(() => {
    if (user) {
      form.setFieldsValue({ username: user.username, pwd: '' });
    }
  }, [user]);
  const _onFinish = useCallback(
    async (values: User.ResetPwdParams) => {
      console.log('提交的重置密码数据：', values);
      try {
        const res = await userApi.resetPwd(values);
        if (res.code === 200) {
          message.success('用户密码重置成功');
          onClose();
          onFinish?.();
          form.resetFields();
        } else {
          message.error(`用户密码重置失败：${res.message}`);
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<any>>;
        console.error('用户密码重置失败：', e);
        message.error(
          `用户密码重置失败: ${e.response?.data.message || e.message}`,
        );
      }
    },
    [userApi, form.resetFields, message],
  );

  return (
    <Modal
      centered
      onCancel={onClose}
      open={!!user}
      title="重置用户密码"
      width={830}
      footer={null}
    >
      <Form<User.ResetPwdParams>
        className="mt-[36px]"
        form={form}
        name="reset-pwd-form"
        onFinish={_onFinish}
        onFinishFailed={(v) => {
          console.log('表单提交失败：', v);
        }}
        autoComplete="off"
      >
        <Form.Item<User.ResetPwdParams> name="username" hidden>
          <Input />
        </Form.Item>

        <Form.Item<User.ResetPwdParams>
          label="新密码"
          name="pwd"
          rules={[
            {
              required: true,
              whitespace: true,
              message: '新密码不能为空',
            },
          ]}
        >
          <Input.Password placeholder="输入新密码" />
        </Form.Item>

        <Form.Item noStyle>
          <div className="flex items-center justify-center mt-[36px]">
            <Button type="primary" htmlType="submit">
              重置
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
