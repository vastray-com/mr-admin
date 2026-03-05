import {
  App,
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Select,
} from 'antd';
import { type FC, useCallback, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useApi } from '@/hooks/useApi';
import { getMenuStatus, menuItems } from '@/router/privateRoutes';
import { DEFAULT_PUBLIC_PATH } from '@/router/route';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';
import type { AxiosError } from 'axios';
import type { User } from '@/typing/user';

export const PageLayout: FC = () => {
  const nav = useNavigate();
  const [user, reset] = useUserStore((s) => [s.user, s.reset]);

  const logout = useCallback(() => {
    reset();
    ls.token.clear();
    ls.user.clear();
    nav(DEFAULT_PUBLIC_PATH);
  }, [nav, reset]);

  const { userApi } = useApi();
  const { message } = App.useApp();
  const [changePwdForm] = Form.useForm<User.ChangePwdParams>();
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const onChangePwdFinish = useCallback((values: User.ChangePwdParams) => {
    console.log('修改密码表单提交成功：', values);
    userApi
      .changePwd(values)
      .then((res) => {
        if (res.code === 200) {
          message.success('密码修改成功，请重新登录');
          setShowChangePwdModal(false);
          logout();
        } else {
          message.error(`密码修改失败：${res.message || '未知错误'}`);
        }
      })
      .catch((e) => {
        const err = e as AxiosError<APIRes<null>>;
        message.error(
          `密码修改失败：${err.response?.data?.message || '未知错误'}`,
        );
      });
  }, []);

  const { pathname } = useLocation();

  return (
    <>
      <Modal
        centered
        onCancel={() => setShowChangePwdModal(false)}
        open={showChangePwdModal}
        title="修改密码"
        width={830}
        footer={null}
        destroyOnHidden
      >
        <Form<User.ChangePwdParams>
          className="mt-[36px]"
          form={changePwdForm}
          name="change-pwd-form"
          onFinish={onChangePwdFinish}
          onFinishFailed={(v) => {
            console.log('表单提交失败：', v);
          }}
          autoComplete="off"
        >
          <Form.Item<User.ChangePwdParams>
            label="原密码"
            name="opwd"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '原密码不能为空',
              },
            ]}
          >
            <Input.Password placeholder="输入原密码" />
          </Form.Item>

          <Form.Item<User.ChangePwdParams>
            label="新密码"
            name="npwd"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '新密码不能为空',
              },
            ]}
          >
            <Input.Password placeholder="输入原密码" />
          </Form.Item>
          <Form.Item<User.ChangePwdParams>
            label="确认新密码"
            name="re_npwd"
            rules={[
              {
                required: true,
                whitespace: true,
                message: '确认新密码不能为空',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('npwd') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>

          <Form.Item noStyle>
            <div className="flex items-center justify-center mt-[36px]">
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Layout className="h-full w-full">
        <Layout.Header className="bg-white h-[48px] w-full flex items-center justify-between px-[16px] b-b-1 border-[#ddd]">
          <div className="flex items-center gap-x-[36px]">
            <div className="h-[28px] flex items-center gap-x-[12px]">
              <img
                src="/ws_logo.svg"
                alt=""
                className="h-full aspect-ratio-square"
              />
              <h1 className="text-title text-[20px] font-bold">伟世 AI</h1>
            </div>
            <Select
              className="w-[128px]"
              options={[{ value: 'changzhouyiyuan', label: '常州一院' }]}
              defaultValue="changzhouyiyuan"
            />
          </div>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'change_password',
                  icon: <i className="i-icon-park-outline:lock" />,
                  label: (
                    <span onClick={() => setShowChangePwdModal(true)}>
                      修改密码
                    </span>
                  ),
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <i className="i-icon-park-outline:logout" />,
                  danger: true,
                  label: <span onClick={logout}>退出登录</span>,
                },
              ],
            }}
          >
            <div className="cursor-pointer">
              <Avatar
                className="bg-[#87d068] w-[28px] h-[28px]"
                icon={
                  <i className="i-icon-park-outline:user text-white text-[16px]" />
                }
              />
              <span className="text-primary ml-[8px]">
                {user?.nickname || user?.username || ''}
              </span>
            </div>
          </Dropdown>
        </Layout.Header>

        <Layout className="h-[calc(100%_-_48px)] w-full">
          <Layout.Sider width={200} className="bg-white h-full">
            <Menu
              mode="inline"
              selectedKeys={getMenuStatus(pathname).selectedKeys}
              openKeys={getMenuStatus(pathname).openKeys}
              onClick={(e) => {
                // console.log(e);
                nav(e.key);
              }}
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems()}
            />
          </Layout.Sider>

          <Layout className="h-full w-[calc(100%_-_200px)]">
            <Layout.Content className="bg-[#F0F2F5] h-full w-full">
              <Outlet />
            </Layout.Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  );
};
