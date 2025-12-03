import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { createRoutes } from '@/router/route';
import { useCacheStore } from '@/store/useCacheStore';
import { _initHighlighter } from '@/utils/highlighter';
import { service } from '@/utils/service';
import type { PushRule } from '@/typing/pushRules';
import type { StructRule } from '@/typing/structRules';

const initApp = async () => {
  console.log('initialize App');

  // 初始化全局 highlighter
  await _initHighlighter();

  // 数据接口初始化
  const paginationParams = { page_size: 1000, page_num: 1 };
  const res = await Promise.all([
    service.get('/admin/encode/list', { params: paginationParams }),
    service.get('/admin/structured_rule/list', { params: paginationParams }),
    service.get('/admin/structured_rule/get_preset_fields'),
    service.get('/admin/push_rule/list', { params: paginationParams }),
  ]);
  const [encodeRes, structRuleRes, presetFieldsRes, pushRuleRes] =
    res as unknown as [
      APIRes<PaginationData<Encode.Item>>,
      APIRes<PaginationData<StructRule.Item>>,
      APIRes<StructRule.PresetFields>,
      APIRes<PaginationData<PushRule.Item>>,
    ];

  // 初始化码表列表
  if (encodeRes.code === 200) {
    // console.log('码表列表初始化成功', res.data.data);
    useCacheStore.getState().setEncodeList(encodeRes.data.data);
  } else {
    console.error('码表列表初始化失败', encodeRes);
    throw new Error('码表列表初始化失败');
  }

  // 初始化结构化规则列表
  if (structRuleRes.code === 200) {
    // console.log('结构化规则列表初始化成功', res.data.data);
    useCacheStore.getState().setStructRuleList(structRuleRes.data.data);
  } else {
    console.error('结构化规则列表初始化失败', structRuleRes);
    throw new Error('结构化规则列表初始化失败');
  }

  // 初始化预设字段列表
  if (presetFieldsRes.code === 200) {
    // console.log('结构化预设字段列表初始化成功', res.data);
    useCacheStore.getState().setPresetFields(presetFieldsRes.data);
  } else {
    console.error('预设字段列表初始化失败', presetFieldsRes);
    throw new Error('预设字段列表初始化失败');
  }

  // 初始化推送规则列表
  if (pushRuleRes.code === 200) {
    // console.log('结构化规则列表初始化成功', res.data.data);
    useCacheStore.getState().setPushRuleList(pushRuleRes.data.data);
  } else {
    console.error('推送规则列表初始化失败', pushRuleRes);
    throw new Error('推送规则列表初始化失败');
  }
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
        console.log('App is ready');
        setIsInitialized(true);
      })
      .catch(() => console.error('App initialization failed'));
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
