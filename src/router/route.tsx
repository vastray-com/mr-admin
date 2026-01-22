import { lazy } from 'react';
import {
  createBrowserRouter,
  Outlet,
  type RouteObject,
  redirect,
} from 'react-router';
import { FullLoading } from '@/components/FullLoading';
import { PageLayout } from '@/components/PageLayout';
import { DEFAULT_PRIVATE_PATH, privateRoutes } from '@/router/privateRoutes';
import { useCacheStore } from '@/store/useCacheStore';
import { _initHighlighter } from '@/utils/highlighter';
import { ls } from '@/utils/ls';
import { service } from '@/utils/service';
import type { LoaderFunction } from 'react-router-dom';
import type { PushRule } from '@/typing/pushRule';
import type { StructuredRuleset } from '@/typing/structuredRuleset';

const LoginPageLazy = lazy(() => import('@/pages/Login/LoginPage'));

export const DEFAULT_PUBLIC_PATH = '/login';

// 公开的路由
const publicRoutes = (): RouteObject[] => [
  {
    path: DEFAULT_PUBLIC_PATH,
    element: <LoginPageLazy />,
  },
];

// 鉴权 Loader
let isInitialized = false;
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
      APIRes<PaginationData<EncodeTable.Item>>,
      APIRes<PaginationData<StructuredRuleset.Item>>,
      APIRes<StructuredRuleset.PresetFields>,
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

const authLoader: LoaderFunction = async ({ request }) => {
  console.log('authLoader triggered for', request.url);
  const isLogged = !!ls.token.get();
  // console.log('isLogged:', isLogged);
  if (!isLogged) {
    return redirect('/');
  }
  // console.log('isInitialized:', isInitialized);
  if (isLogged && !isInitialized) {
    try {
      await initApp();
      console.log('App is ready');
      isInitialized = true;
    } catch (e) {
      console.error('App initialization failed:', e);
    }
  }

  return null;
};

const publicLoader: LoaderFunction = async ({ request }) => {
  console.log('publicLoader triggered for', request.url);
  const url = new URL(request.url);
  const isLogged = !!ls.token.get();

  if (isLogged && url.pathname === DEFAULT_PUBLIC_PATH) {
    return redirect(DEFAULT_PRIVATE_PATH);
  }

  console.log(isLogged, url.pathname);
  return null;
};

// 创建路由
export const routes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <Outlet />,
      children: [
        {
          index: true,
          loader: () => redirect(DEFAULT_PUBLIC_PATH),
        },
        {
          element: <Outlet />,
          children: publicRoutes(),
          loader: publicLoader,
        },
        {
          element: <PageLayout />,
          children: privateRoutes(),
          loader: authLoader,
          hydrateFallbackElement: <FullLoading />,
        },
      ],
    },
    {
      path: '*',
      element: <div>404 Not Found</div>,
    },
  ]);
