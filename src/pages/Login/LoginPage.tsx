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
    <main className="flex justify-center items-center h-full w-full gradient-bg">
      <div className="z-1 w-[80%] max-w-[1000px] h-[640px] bg-1 rounded-[2rem] shadow-2xl overflow-hidden flex items-center justify-center">
        <div className="h-full basis-[50%] shrink-0 grow-0 p-[3em] flex flex-col">
          <div className="mt-[3em]">
            <img
              src="/ws_logo.svg"
              alt=""
              className="w-[64px] aspect-ratio-square"
            />
            <h2 className="text-[28px] fg-primary mt-[0.4em]">
              临床数据资产平台
            </h2>
          </div>

          <div className="mt-[4em]">
            <h1 className="text-[32px] font-medium fg-title mb-[0.5em]">
              欢迎登录
            </h1>

            <Form
              form={form}
              name="login"
              onFinish={onLogin}
              size="large"
              requiredMark={false}
              layout="vertical"
            >
              <Form.Item<User.LoginParams>
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { whitespace: true, message: '用户名不能为空' },
                ]}
              >
                <Input className="py-[0.8em]" placeholder="输入用户名" />
              </Form.Item>
              <Form.Item<User.LoginParams>
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { whitespace: true, message: '密码不能为空' },
                ]}
              >
                <Input.Password className="py-[0.8em]" placeholder="输入密码" />
              </Form.Item>
              <Form.Item noStyle>
                <Button
                  block
                  type="primary"
                  htmlType="submit"
                  className="h-[50px] text-[18px]"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>

        <div className="h-full min-w-[calc(800px_/_(1308px_/_640px))] basis-[50%] shrink-0 grow-0 p-[1em]">
          <div className="h-full w-full rounded-[1.5rem] overflow-hidden flex justify-center items-center">
            <img src="/login_img.jpg" alt="" className="w-full aspect-ratio" />
          </div>
        </div>
      </div>

      <div className="pos-absolute top-0 left-0 w-full h-full mix-blend-overlay flex justify-center items-center opacity-100 bg-repeat bg-[url('/login_bg.jpg')]" />
    </main>
  );
};

export default LoginPage;
