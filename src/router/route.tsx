import { lazy } from 'react';
import {
  createBrowserRouter,
  Outlet,
  type RouteObject,
  redirect,
} from 'react-router';
import { PageLayout } from '@/components/PageLayout';
import {
  DEFAULT_PRIVATE_PATH,
  privateRouteKeys,
  privateRoutes,
} from '@/router/privateRoutes';
import { ls } from '@/utils/ls';
import type { LoaderFunction } from 'react-router-dom';

const LoginPageLazy = lazy(() => import('@/pages/Login/LoginPage'));

export const DEFAULT_PUBLIC_PATH = '/login';

// 公开的路由
const publicRoutes: RouteObject[] = [
  {
    path: DEFAULT_PUBLIC_PATH,
    element: <LoginPageLazy />,
  },
];

// 鉴权 Loader
const authLoader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname === '/') {
    return redirect(DEFAULT_PUBLIC_PATH);
  }

  const isLogged = !!ls.token.get().at;
  if (isLogged && url.pathname === DEFAULT_PUBLIC_PATH) {
    return redirect(DEFAULT_PRIVATE_PATH);
  }
  if (!isLogged && privateRouteKeys.includes(url.pathname)) {
    return redirect(DEFAULT_PUBLIC_PATH);
  }

  return null;
};

// 创建路由
export const createRoutes = () =>
  createBrowserRouter([
    {
      path: '/',
      element: <Outlet />,
      loader: authLoader,
      children: [
        {
          path: '/',
          element: <Outlet />,
          children: publicRoutes,
        },
        {
          path: '/',
          element: <PageLayout />,
          children: privateRoutes,
        },
      ],
    },
    {
      path: '*',
      element: <div>404 Not Found</div>,
    },
  ]);
