import { App, Button, Form, Input } from 'antd';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '@/hooks/useApi';
import { DEFAULT_PRIVATE_PATH } from '@/router/privateRoutes';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';
import type { AxiosError } from 'axios';
import type { User } from '@/typing/user';

const LoginPage = () => {
  const { userApi } = useApi();
  const { message } = App.useApp();
  const setUser = useUserStore((s) => s.setUser);
  const nav = useNavigate();

  const [form] = Form.useForm();
  const onLogin = useCallback(
    async (v: User.LoginParams) => {
      try {
        const res = await userApi.login(v);
        if (res.code === 200) {
          ls.token.set(res.data.token);
          setUser(res.data.user);
          message.success('登录成功');
          nav(DEFAULT_PRIVATE_PATH);
          return;
        } else {
          message.error(res.message || '登录失败');
        }
      } catch (error) {
        const e = error as AxiosError<APIRes<string>>;
        message.error(`登录失败: ${e.response?.data?.message || e.message}`);
      }
    },
    [message, nav, setUser, userApi],
  );

  return (
    <main className="flex flex-col gap-y-[16px] justify-center items-center h-full w-full">
      <h1 className="text-[28px]">系统登录</h1>
      <div className="w-[300px]">
        <Form form={form} name="login" onFinish={onLogin}>
          <Form.Item<User.LoginParams>
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { whitespace: true, message: '用户名不能为空' },
            ]}
          >
            <Input placeholder="输入用户名" />
          </Form.Item>
          <Form.Item<User.LoginParams>
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { whitespace: true, message: '密码不能为空' },
            ]}
          >
            <Input.Password placeholder="输入密码" />
          </Form.Item>
          <Form.Item noStyle>
            <Button block type="primary" htmlType="submit">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </main>
  );
};

export default LoginPage;
