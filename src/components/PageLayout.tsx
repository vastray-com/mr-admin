import { Avatar, Dropdown, Layout, Menu } from 'antd';
import { AnimatePresence, motion } from 'motion/react';
import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router';
import { ChangePwdModal } from '@/components/Modal/ChangePwdModal';
import { AgentChatDock } from '@/pages/AgentManagement/Chat/AgentChatDock';
import { AgentDockButton } from '@/pages/AgentManagement/Chat/AgentDockButton';
import {
  loadAgentDockPrefs,
  saveAgentDockPrefs,
} from '@/pages/AgentManagement/dockPrefs';
import { getMenuStatus, menuItems } from '@/router/privateRoutes';
import { DEFAULT_PUBLIC_PATH } from '@/router/route';
import { useAgentStore } from '@/store/useAgentStore';
import { useCacheStore } from '@/store/useCacheStore';
import { useUserStore } from '@/store/useUserStore';
import { ls } from '@/utils/ls';

export const PageLayout: FC = () => {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const currentOutlet = useOutlet();
  const menuStatus = useMemo(() => getMenuStatus(pathname), [pathname]);

  const [user, reset] = useUserStore((s) => [s.user, s.reset]);
  const [siderWidth, layoutZenMode] = useCacheStore((s) => [
    s.siderWidth,
    s.layoutZenMode,
  ]);
  const agentRunning = useAgentStore((s) => s.running);
  const [openKeys, setOpenKeys] = useState<string[]>(menuStatus.openKeys);

  const [showChangePwdModal, setShowChangePwdModal] = useState(false);

  // 智能体对话右侧侧栏（开合/全屏/宽度偏好持久化到 localStorage）
  const [initialDockPrefs] = useState(loadAgentDockPrefs);
  const [agentDockOpen, setAgentDockOpen] = useState(initialDockPrefs.open);
  const [agentDockFullscreen, setAgentDockFullscreen] = useState(
    initialDockPrefs.fullscreen,
  );
  const [agentDockWidth, setAgentDockWidth] = useState(initialDockPrefs.width);
  // 首次打开才挂载，避免应用启动时多余的会话请求
  const [agentDockMounted, setAgentDockMounted] = useState(
    initialDockPrefs.open,
  );

  const openAgentDock = useCallback(() => {
    setAgentDockMounted(true);
    setAgentDockOpen(true);
  }, []);

  const closeAgentDock = useCallback(() => setAgentDockOpen(false), []);

  const toggleAgentDockFullscreen = useCallback(
    () => setAgentDockFullscreen((prev) => !prev),
    [],
  );

  // 持久化侧栏偏好（拖拽调宽时借助定时器做防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAgentDockPrefs({
        open: agentDockOpen,
        fullscreen: agentDockFullscreen,
        width: agentDockWidth,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [agentDockOpen, agentDockFullscreen, agentDockWidth]);

  const logout = useCallback(() => {
    reset();
    ls.token.clear();
    ls.user.clear();
    setTimeout(() => nav(DEFAULT_PUBLIC_PATH), 200);
  }, [nav, reset]);

  useEffect(() => {
    if (!menuStatus.openKeys || menuStatus.openKeys.length < 1) return;
    setOpenKeys((prev) =>
      Array.from(new Set([...prev, ...menuStatus.openKeys])),
    );
  }, [menuStatus.openKeys]);

  // 侧栏占位宽度：全屏时脱离文档流，不占位；收起时收敛为 0
  const siderMargin = siderWidth > 0 ? 12 : 0;
  const dockFullscreen = agentDockOpen && agentDockFullscreen;
  const dockReserved =
    agentDockOpen && !dockFullscreen ? agentDockWidth + 12 : 0;

  return (
    <>
      <ChangePwdModal
        open={showChangePwdModal}
        onClose={() => setShowChangePwdModal(false)}
        onFinish={logout}
      />

      <Layout className="h-full w-full p-[12px] gradient-bg">
        {!layoutZenMode && (
          <Layout.Header className="z-1 glass-bg h-[64px] w-full flex items-center justify-between px-[24px]">
            <div className="flex items-center gap-x-[36px]">
              <div
                className="h-[28px] flex items-center gap-x-[12px] cursor-pointer"
                onClick={() => nav('/')}
              >
                <img
                  src={import.meta.env.VITE_APP_LOGO}
                  alt=""
                  className="h-full aspect-ratio-square"
                />
                <h1 className="text-title text-[20px] font-bold">
                  {import.meta.env.VITE_APP_NAME}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-x-[12px]">
              <AgentDockButton
                open={agentDockOpen}
                running={agentRunning}
                onToggle={agentDockOpen ? closeAgentDock : openAgentDock}
              />

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
            </div>
          </Layout.Header>
        )}

        <Layout
          className={`z-1 h-full w-full ${layoutZenMode ? '' : 'mt-[12px]'} bg-[unset]`}
        >
          <Layout.Sider
            width={siderWidth}
            className="glass-bg h-full p-0 overflow-x-hidden overflow-y-auto"
          >
            <Menu
              mode="inline"
              selectedKeys={menuStatus.selectedKeys}
              openKeys={openKeys}
              onOpenChange={(keys) => setOpenKeys(keys)}
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
              className="h-full"
              style={{
                marginLeft: siderMargin,
                width: `calc(100% - ${siderWidth}px - ${siderMargin}px - ${dockReserved}px)`,
                // 与侧栏宽度动画保持同步
                transition: 'width 0.2s ease, margin-left 0.2s ease',
              }}
            >
              <Layout className="h-full w-full glass-bg p-0 overflow-hidden">
                <Layout.Content className="h-full w-full">
                  {currentOutlet}
                </Layout.Content>
              </Layout>
            </motion.div>
          </AnimatePresence>

          {agentDockMounted && (
            <AgentChatDock
              open={agentDockOpen}
              fullscreen={agentDockFullscreen}
              width={agentDockWidth}
              onResize={setAgentDockWidth}
              onClose={closeAgentDock}
              onToggleFullscreen={toggleAgentDockFullscreen}
            />
          )}
        </Layout>

        {/*<div className="pos-absolute w-full h-full top-0 left-0 bg-[url('/page_bg.webp')] bg-cover bg-no-repeat opacity-32"></div>*/}
      </Layout>
    </>
  );
};
