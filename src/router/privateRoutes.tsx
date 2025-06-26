import { lazy, type ReactNode } from 'react';
import { Outlet, type RouteObject, redirect } from 'react-router';
import type { MenuProps } from 'antd';
import type { LoaderFunction } from 'react-router-dom';

const MedicalRecordTemplateLazy = lazy(
  () =>
    import(
      '@/pages/TemplateManagement/MedicalRecordTemplate/MedicalRecordTemplatePage'
    ),
);
const MedicalRecordTemplateDetailLazy = lazy(
  () =>
    import(
      '@/pages/TemplateManagement/MedicalRecordTemplate/MedicalRecordTemplateDetail/MedicalRecordTemplateDetail'
    ),
);

type BaseRoute = {
  key: string;
  element: ReactNode;
  label: string;
  icon?: ReactNode;
  addToMenu?: boolean; // 是否隐藏菜单
  children?: {
    key: string;
    element: ReactNode;
    label: string;
    addToMenu?: boolean; // 是否隐藏菜单
    selectedKeys?: string[]; // 选中时的 key
  }[];
  loader?: LoaderFunction;
}[];

// 需要鉴权的路由
const privateBaseRoutes: BaseRoute = [
  {
    key: '/template_management',
    element: <Outlet />,
    label: '模版配置',
    addToMenu: true,
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
        addToMenu: true,
      },
      {
        key: '/template_management/medical_record_template/:id',
        selectedKeys: ['/template_management/medical_record_template'],
        element: <MedicalRecordTemplateDetailLazy />,
        label: '病历模版详情',
        addToMenu: false,
      },
      {
        key: '/template_management/encode_management',
        element: <div>码表管理列表</div>,
        label: '码表管理',
        addToMenu: true,
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
  if (!cur.addToMenu) return pre;
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
        selectedKeys: !child.addToMenu
          ? child.selectedKeys
            ? child.selectedKeys
            : []
          : [child.key],
      };
    });
  } else {
    menuPathMap[cur.key] = {
      openKeys: [],
      selectedKeys: [cur.key],
    };
  }

  // 移除 addToMenu 属性
  const pushedItem = { ...item };
  if (pushedItem.children && pushedItem.children.length > 0) {
    pushedItem.children = pushedItem.children.map((child) => {
      // biome-ignore lint/correctness/noUnusedVariables: false
      const { addToMenu, selectedKeys, ...rest } = child;
      return rest;
    });
  }
  pre.push(pushedItem);
  return pre;
}, []);

export const getMenuStatus = (path: string) => {
  const target = menuPathMap[path];
  if (target) return target;

  // 如果 key 中存在 path 参数则匹配任意字符串参数
  for (const pattern in menuPathMap) {
    if (!pattern.includes(':')) continue; // 跳过没有参数的路径

    // 将参数替换为正则
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(path)) {
      return menuPathMap[pattern];
    }
  }

  return { openKeys: [], selectedKeys: [] };
};
