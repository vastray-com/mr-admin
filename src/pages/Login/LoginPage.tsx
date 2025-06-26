import { Button } from 'antd';
import { useNavigate } from 'react-router';
import { DEFAULT_PRIVATE_PATH } from '@/router/route';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';

const LoginPage = () => {
  const setUser = useUserStore((s) => s.setUser);
  const nav = useNavigate();
  const onLogin = () => {
    ls.token.set({
      at: 'aaa',
      rt: 'bbb',
    });
    const user = { name: 'Admin', id: 1 };
    ls.user.set(user);
    setUser(user);
    nav(DEFAULT_PRIVATE_PATH);
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
