import { lazy } from 'react';
import {
  createBrowserRouter,
  Outlet,
  type RouteObject,
  redirect,
} from 'react-router';
import { ls } from '@/utils/ls.tsx';
import type { LoaderFunction } from 'react-router-dom';

const LoginPageLazy = lazy(() => import('@/pages/Login/LoginPage.tsx'));

export const DEFAULT_PUBLIC_PATH = '/login';
export const DEFAULT_PRIVATE_PATH = '/home';

// 公开的路由
const publicRoutes: RouteObject[] = [
  {
    path: DEFAULT_PUBLIC_PATH,
    element: <LoginPageLazy />,
  },
];

// 需要鉴权的路由
const privateRoutes: RouteObject[] = [
  {
    path: DEFAULT_PRIVATE_PATH,
    element: <div>home page</div>,
  },
];
const privatePaths = privateRoutes.map((route) => route.path);

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
  if (!isLogged && privatePaths.includes(url.pathname)) {
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
      children: [...privateRoutes, ...publicRoutes],
    },
  ]);
