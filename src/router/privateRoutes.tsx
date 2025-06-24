import { lazy, type ReactNode } from 'react';
import { Outlet, type RouteObject, redirect } from 'react-router';
import type { MenuProps } from 'antd';
import type { LoaderFunction } from 'react-router-dom';

const MedicalRecordTemplateLazy = lazy(
  () =>
    import(
      '@/pages/TemplateManagement/MedicalRecordTemplate/MedicalRecordTemplatePage.tsx'
    ),
);

type BaseRoute = {
  key: string;
  element: ReactNode;
  label: string;
  icon?: ReactNode;
  children?: {
    key: string;
    element: ReactNode;
    label: string;
  }[];
  loader?: LoaderFunction;
}[];

// 需要鉴权的路由
const privateBaseRoutes: BaseRoute = [
  {
    key: '/template_management',
    element: <Outlet />,
    label: '模版配置',
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/template_management') {
        return redirect('/template_management/medical_record_template');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:file-editing-one" />,
    children: [
      {
        key: '/template_management/medical_record_template',
        element: <MedicalRecordTemplateLazy />,
        label: '病历模版',
      },
      {
        key: '/template_management/encode_management',
        element: <div>码表管理列表</div>,
        label: '码表管理',
      },
    ],
  },
];

// 私有路由 path 列表
export const privateRouteKeys = privateBaseRoutes.reduce<string[]>(
  (pre, cur) => {
    const isExist = pre.some((item) => item === cur.key);
    !isExist && pre.push(cur.key);

    if (cur.children) {
      cur.children.forEach((child) => {
        const isExist = pre.some((item) => item === child.key);
        !isExist && pre.push(child.key);
      });
    }

    return pre;
  },
  [],
);

// 私有路由
export const privateRoutes = privateBaseRoutes.reduce<RouteObject[]>(
  (pre, cur) => {
    const route: RouteObject = {
      path: cur.key,
      element: cur.element,
    };
    if (cur.loader) {
      route.loader = cur.loader;
    }
    if (cur.children) {
      route.children = cur.children.map((child) => ({
        path: child.key,
        element: child.element,
      }));
    }

    pre.push(route);
    return pre;
  },
  [],
);

// menu 列表
const menuPathMap: Record<
  string,
  { openKeys: string[]; selectedKeys: string[] }
> = {};
export const menuItems = privateBaseRoutes.reduce<
  Required<MenuProps>['items'][number][]
>((pre, cur) => {
  const item = {
    key: cur.key,
    label: cur.label,
    icon: cur.icon,
    ...(cur.children && cur.children.length > 0 && { children: cur.children }),
  };

  if (item.children) {
    item.children.forEach((child) => {
      menuPathMap[child.key] = {
        openKeys: [cur.key],
        selectedKeys: [child.key],
      };
    });
  } else {
    menuPathMap[cur.key] = {
      openKeys: [],
      selectedKeys: [cur.key],
    };
  }

  pre.push(item);
  return pre;
}, []);

export const getMenuStatus = (path: string) => {
  return menuPathMap[path] || { openKeys: [], selectedKeys: [] };
};
