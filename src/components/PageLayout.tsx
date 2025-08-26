import { Avatar, Layout, Menu, Select } from 'antd';
import { type FC, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { getMenuStatus, menuItems } from '@/router/privateRoutes';
import { DEFAULT_PUBLIC_PATH } from '@/router/route';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';

export const PageLayout: FC = () => {
  const nav = useNavigate();
  const [user, reset] = useUserStore((s) => [s.user, s.reset]);

  const logout = useCallback(() => {
    reset();
    ls.token.clear();
    ls.user.clear();
    nav(DEFAULT_PUBLIC_PATH);
  }, [nav, reset]);

  const { pathname } = useLocation();

  return (
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

        <div onClick={logout} className="cursor-pointer">
          <Avatar
            className="bg-[#87d068] w-[28px] h-[28px]"
            icon={
              <i className="i-icon-park-outline:user text-white text-[16px]" />
            }
          />
          <span className="text-primary ml-[8px]">{user?.name}</span>
        </div>
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
            items={menuItems}
          />
        </Layout.Sider>

        <Layout className="h-full w-[calc(100%_-_200px)]">
          <Layout.Content className="bg-[#F0F2F5] h-full w-full">
            <Outlet />
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
