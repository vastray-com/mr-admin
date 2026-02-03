import { Outlet, type RouteObject, redirect } from 'react-router';
import LazyComponents from '@/router/lazyComponents';
import { useUserStore } from '@/store/useUserStore';
import { UserRole } from '@/typing/enum';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import type { LoaderFunction } from 'react-router-dom';

type BaseRoute = {
  key: string;
  element: ReactNode;
  label: string;
  icon?: ReactNode;
  addToMenu?: boolean; // 是否隐藏菜单
  roles: UserRole[]; // 可访问角色
  children?: {
    key: string;
    element: ReactNode;
    label: string;
    addToMenu?: boolean; // 是否隐藏菜单
    selectedKeys?: string[]; // 选中时的 key
    roles: UserRole[];
  }[];
  loader?: LoaderFunction;
}[];

// 默认私有路由
export const DEFAULT_PRIVATE_PATH = '/data/dashboard';

// 需要鉴权的路由
const privateBaseRoutes: BaseRoute = [
  {
    key: '/data',
    element: <Outlet />,
    label: '数据资产',
    addToMenu: true,
    roles: [UserRole.Admin, UserRole.User],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/data') {
        return redirect('/data/dashboard');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:data" />,
    children: [
      {
        key: '/data/dashboard',
        element: <LazyComponents.Dashboard />,
        label: '数据总览',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/data/warehouse/data_list',
        element: <LazyComponents.WarehouseDataPreview />,
        label: '数据查询',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/data/dataset/list',
        element: <LazyComponents.DatasetList />,
        label: '数据集列表',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/data/dataset/detail/:uid',
        selectedKeys: ['/data/dataset/list'],
        element: <LazyComponents.DatasetDetail />,
        label: '数据集详情',
        addToMenu: false,
        roles: [UserRole.Admin, UserRole.User],
      },
    ],
  },
  {
    key: '/rule_management',
    element: <Outlet />,
    label: '结构化规则',
    addToMenu: true,
    roles: [UserRole.Admin, UserRole.User],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/rule_management') {
        return redirect('/rule_management/ruleset');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:sort-amount-down" />,
    children: [
      {
        key: '/rule_management/ruleset',
        element: <LazyComponents.StructuredRulesetList />,
        label: '规则配置',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rule_management/ruleset/:uid',
        selectedKeys: ['/rule_management/ruleset'],
        element: <LazyComponents.StructuredRulesetDetail />,
        label: '规则详情',
        addToMenu: false,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rule_management/push_rule',
        element: <LazyComponents.PushRuleList />,
        label: '推送规则',
        addToMenu: true,
        roles: [UserRole.Admin],
      },
      {
        key: '/rule_management/push_rule/:uid',
        selectedKeys: ['/rule_management/push_rule'],
        element: <LazyComponents.PushRuleDetail />,
        label: '推送规则详情',
        addToMenu: false,
        roles: [UserRole.Admin],
      },
      {
        key: '/rule_management/encode_table',
        element: <LazyComponents.EncodeTableList />,
        label: '码表管理',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rule_management/encode_table/:uid',
        selectedKeys: ['/rule_management/encode_table'],
        element: <LazyComponents.EncodeTableDetail />,
        label: '码表详情',
        addToMenu: false,
        roles: [UserRole.Admin, UserRole.User],
      },
    ],
  },
  {
    key: '/task_management',
    element: <Outlet />,
    label: '结构化任务',
    addToMenu: true,
    roles: [UserRole.Admin],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/task_management') {
        return redirect('/task_management/list');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:command" />,
    children: [
      {
        key: '/task_management/list',
        element: <LazyComponents.TaskList />,
        label: '任务列表',
        addToMenu: true,
        roles: [UserRole.Admin],
      },
      {
        key: '/task_management/detail/:taskUid',
        element: <LazyComponents.TaskDetail />,
        label: '任务详情',
        addToMenu: false,
        selectedKeys: ['/task_management/list'],
        roles: [UserRole.Admin],
      },
      {
        key: '/task_management/detail/:taskUid/:instanceUid',
        element: <LazyComponents.TaskInstanceDetail />,
        label: '执行结果',
        addToMenu: false,
        selectedKeys: ['/task_management/list'],
        roles: [UserRole.Admin],
      },
    ],
  },
  {
    key: '/user_management',
    element: <Outlet />,
    label: '用户管理',
    addToMenu: true,
    roles: [UserRole.Admin],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/user_management') {
        return redirect('/user_management/list');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:every-user" />,
    children: [
      {
        key: '/user_management/list',
        element: <LazyComponents.UserList />,
        label: '用户列表',
        addToMenu: true,
        roles: [UserRole.Admin],
      },
    ],
  },
  {
    key: '/sys_management',
    element: <Outlet />,
    label: '系统管理',
    addToMenu: true,
    roles: [UserRole.Admin],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/sys_management') {
        return redirect('/sys_management/tokens');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:setting-two" />,
    children: [
      {
        key: '/sys_management/tokens',
        element: <LazyComponents.TokenList />,
        label: 'API 令牌',
        addToMenu: true,
        roles: [UserRole.Admin],
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
export const privateRoutes = () => {
  const role = useUserStore.getState().user?.role;
  return privateBaseRoutes.reduce<RouteObject[]>((pre, cur) => {
    if (role && !cur.roles?.includes(role)) return pre;

    const route: RouteObject = {
      path: cur.key,
      element: cur.element,
    };
    if (cur.loader) {
      route.loader = cur.loader;
    }
    if (cur.children) {
      route.children = cur.children
        .filter((r) => role && r.roles.includes(role))
        .map((child) => ({
          path: child.key,
          element: child.element,
        }));
    }

    pre.push(route);
    return pre;
  }, []);
};

// menu 列表
const allFirstLevelKeys = () => {
  const role = useUserStore.getState().user?.role;
  return privateBaseRoutes
    .filter((r) => r.addToMenu && (role ? r.roles.includes(role) : true))
    .map((r) => r.key);
};
const menuPathMap: Record<
  string,
  { openKeys: string[]; selectedKeys: string[] }
> = {};
export const menuItems = () =>
  privateBaseRoutes.reduce<Required<MenuProps>['items'][number][]>(
    (pre, cur) => {
      const role = useUserStore.getState().user?.role;

      // console.log('cur', cur);
      if (!cur.addToMenu) return pre;
      // console.log('role', role);
      if (role && !cur.roles?.includes(role)) return pre;
      // console.log('passed');

      const item = {
        key: cur.key,
        label: cur.label,
        icon: cur.icon,
        ...(cur.children &&
          cur.children.length > 0 && {
            children: cur.children.filter(
              (c) => role && c.roles.includes(role),
            ),
          }),
      };

      if (item.children) {
        item.children.forEach((child) => {
          menuPathMap[child.key] = {
            // 二级菜单展开对应一级菜单
            openKeys: allFirstLevelKeys(),
            selectedKeys: !child.addToMenu
              ? child.selectedKeys
                ? child.selectedKeys
                : []
              : [child.key],
          };
        });
      } else {
        menuPathMap[cur.key] = {
          // 一级菜单
          openKeys: allFirstLevelKeys(),
          selectedKeys: [cur.key],
        };
      }

      // 移除 addToMenu 属性
      const pushedItem = { ...item };
      if (pushedItem.children && pushedItem.children.length > 0) {
        pushedItem.children = pushedItem.children
          .map((child) => {
            if (!child.addToMenu) return null; // 如果不添加到菜单，则直接返回原对象
            // biome-ignore lint/correctness/noUnusedVariables: false
            const { addToMenu, selectedKeys, ...rest } = child;
            return rest;
          })
          .filter((child) => !!child); // 过滤掉 null 值
      }
      pre.push(pushedItem);
      return pre;
    },
    [],
  );

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
