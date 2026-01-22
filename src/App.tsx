import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { RouterProvider } from 'react-router/dom';
import { routes } from '@/router/route';
import { useUserStore } from '@/store/useUserStore';

function App() {
  const user = useUserStore((s) => s.user);

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp
        message={{ maxCount: 2 }}
        notification={{ maxCount: 1 }}
        component="div"
      >
        <RouterProvider key={user?.uid ?? 'guest'} router={routes()} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
