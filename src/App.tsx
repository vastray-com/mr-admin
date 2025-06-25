import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { createRoutes } from '@/router/route.tsx';

const initApp = async () => {
  console.log('initialize App');
  return;
};

function App() {
  const [isTimeout, setIsTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsTimeout(true), 80); // Set timeout to 5 seconds
    return () => clearTimeout(timer); // Cleanup the timer on unmount
  });

  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    initApp()
      .then(() => {
        setIsInitialized(true);
        console.log('App is ready');
      })
      .catch(() => {
        console.error('App initialization failed');
      });
  }, []);

  if (!isInitialized) {
    return (
      <div
        className={clsx(
          'flex w-full h-full flex-col gap-y-[8px] items-center justify-center',
          isTimeout ? 'visible' : 'hidden',
        )}
      >
        <div className="i-line-md:loading-loop text-[36px] fg-secondary" />
        <span className="text-[14px] fg-secondary">Loading...</span>
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp
        message={{ maxCount: 2 }}
        notification={{ maxCount: 1 }}
        component={false}
      >
        <RouterProvider router={createRoutes()} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
