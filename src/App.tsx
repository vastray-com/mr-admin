import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router/dom';
import { routes } from '@/router/route';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp
        message={{ maxCount: 2 }}
        notification={{ maxCount: 1 }}
        component={false}
      >
        <RouterProvider router={routes} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
