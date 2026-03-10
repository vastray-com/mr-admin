import { Avatar, Dropdown, Layout, Menu } from 'antd';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useCallback, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router';
import { ChangePwdModal } from '@/components/Modal/ChangePwdModal';
import { getMenuStatus, menuItems } from '@/router/privateRoutes';
import { DEFAULT_PUBLIC_PATH } from '@/router/route';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';

export const PageLayout: FC = () => {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const currentOutlet = useOutlet();

  const [user, reset] = useUserStore((s) => [s.user, s.reset]);

  const [showChangePwdModal, setShowChangePwdModal] = useState(false);

  const logout = useCallback(() => {
    reset();
    ls.token.clear();
    ls.user.clear();
    nav(DEFAULT_PUBLIC_PATH);
  }, [nav, reset]);

  return (
    <>
      <ChangePwdModal
        open={showChangePwdModal}
        onClose={() => setShowChangePwdModal(false)}
        onFinish={logout}
      />

      <Layout className="h-full w-full p-[12px] gradient-bg">
        <Layout.Header className="z-1 glass-bg h-[64px] w-full flex items-center justify-between px-[24px]">
          <div className="flex items-center gap-x-[36px]">
            <div
              className="h-[28px] flex items-center gap-x-[12px] cursor-pointer"
              onClick={() => nav('/')}
            >
              <img
                src="/ws_logo.svg"
                alt=""
                className="h-full aspect-ratio-square"
              />
              <h1 className="text-title text-[20px] font-bold">
                临床数据资产平台
              </h1>
            </div>
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
            <div className="cursor-pointer flex items-center justify-center gap-x-[8px]">
              <Avatar
                className="w-[40px] h-[40px]"
                icon={<img src="/avatar.jpg" alt="avatar" />}
              />
              <span className="text-primary font-medium text-[1.1em]">
                {user?.nickname || user?.username || ''}
              </span>
              <span className="i-icon-park-outline:down text-[20px]" />
            </div>
          </Dropdown>
        </Layout.Header>

        <Layout className="z-1 h-full w-full mt-[12px] bg-[unset]">
          <Layout.Sider width={200} className="glass-bg h-full p-0">
            <Menu
              mode="inline"
              selectedKeys={getMenuStatus(pathname).selectedKeys}
              openKeys={getMenuStatus(pathname).openKeys}
              onClick={(e) => {
                // console.log(e);
                nav(e.key);
              }}
              style={{
                height: '100%',
                borderRight: 0,
                background: 'transparent',
              }}
              items={menuItems()}
            />
          </Layout.Sider>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -16, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-[calc(100%_-_200px_-_12px)] ml-[12px]"
            >
              <Layout className="h-full w-full glass-bg p-0 overflow-hidden">
                <Layout.Content className="h-full w-full">
                  {currentOutlet}
                </Layout.Content>
              </Layout>
            </motion.div>
          </AnimatePresence>
        </Layout>

        {/*<div className="pos-absolute w-full h-full top-0 left-0 bg-[url('/page_bg.webp')] bg-cover bg-no-repeat opacity-32"></div>*/}
      </Layout>
    </>
  );
};
