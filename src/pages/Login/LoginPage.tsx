import { App, Button } from 'antd';
import { useNavigate } from 'react-router';
import { useApi } from '@/hooks/useApi';
import { DEFAULT_PRIVATE_PATH } from '@/router/privateRoutes';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';

const LoginPage = () => {
  const { userApi } = useApi();
  const { message } = App.useApp();
  const setUser = useUserStore((s) => s.setUser);
  const nav = useNavigate();
  const onLogin = async () => {
    try {
      const res = await userApi.login({
        username: 'admin',
        password: 'admin',
      });
      if (res.code === 200) {
        ls.token.set(res.data.token);
        setUser(res.data.user);
        message.success('登录成功');
        nav(DEFAULT_PRIVATE_PATH);
        return;
      } else {
        console.log(res);
        // message.error(res || '登录失败');
      }
    } catch (error) {
      console.error('Login failed:', error);
      message.error('登录失败');
    }
  };

  return (
    <main className="flex flex-col gap-y-[16px] justify-center items-center h-full w-full">
      <h1 className="text-[28px]">Login Page</h1>
      <Button type="primary" onClick={onLogin}>
        登录
      </Button>
    </main>
  );
};

export default LoginPage;
