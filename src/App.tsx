import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { createRoutes } from '@/router/route';
import { useCacheStore } from '@/store/useCacheStore';
import { service } from '@/utils/service';
import type { StructRule } from '@/typing/structRules';

const initApp = async () => {
  console.log('initialize App');

  // 初始化码表列表
  try {
    const res = await service.get('/admin/encode/list', {
      params: { page_size: 1000, page_num: 1 },
    });
    const r = res as unknown as APIRes<PaginationData<Encode.Item>>;
    if (r.code === 200) {
      // console.log('码表列表初始化成功', res.data.data);
      useCacheStore.getState().setEncodeList(res.data.data);
    }
  } catch (e) {
    console.error('码表列表初始化失败', e);
    throw e;
  }

  // 初始化结构化规则列表
  try {
    const res = await service.get('/admin/structured_rule/list', {
      params: { page_size: 1000, page_num: 1 },
    });
    const r = res as unknown as APIRes<PaginationData<StructRule.Item>>;
    if (r.code === 200) {
      // console.log('结构化规则列表初始化成功', res.data.data);
      useCacheStore.getState().setStructRuleList(res.data.data);
    }
  } catch (e) {
    console.error('结构化规则列表初始化失败', e);
    throw e;
  }
};

function App() {
  const [isTimeout, setIsTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsTimeout(true), 80); // Set timeout to 5 seconds
    return () => clearTimeout(timer); // Cleanup the timer on unmount
  });

  const isInitialized = useRef(false);
  useEffect(() => {
    isInitialized.current = true;
    initApp()
      .then(() => console.log('App is ready'))
      .catch(() => console.error('App initialization failed'));
  }, []);

  if (!isInitialized.current) {
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
