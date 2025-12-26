import { lazy, type ReactNode } from 'react';
import { Outlet, type RouteObject, redirect } from 'react-router';
import { useUserStore } from '@/store/useUserStore';
import { UserRole } from '@/typing/enum';
import type { MenuProps } from 'antd';
import type { LoaderFunction } from 'react-router-dom';

const StructRulesLazy = lazy(
  () => import('@/pages/RulesManagement/StructRules/StructRulesPage'),
);
const StructRuleDetailLazy = lazy(
  () =>
    import(
      '@/pages/RulesManagement/StructRules/StructRuleDetail/StructRuleDetailPage'
    ),
);
const PushRulesLazy = lazy(
  () => import('@/pages/RulesManagement/PushRules/PushRulesPage'),
);
const PushRuleDetailLazy = lazy(
  () =>
    import(
      '@/pages/RulesManagement/PushRules/PushRuleDetail/PushRuleDetailPage'
    ),
);
const EncodeLazy = lazy(
  () => import('@/pages/RulesManagement/Encode/EncodePage'),
);
const EncodeDetailLazy = lazy(
  () => import('@/pages/RulesManagement/Encode/EncodeDetail/EncodeDetailPage'),
);
const TaskListLazy = lazy(
  () => import('@/pages/TasksManagement/TaskList/TaskListPage'),
);
const TaskDetailLazy = lazy(
  () => import('@/pages/TasksManagement/TaskList/TaskDetail/TaskDetailPage'),
);
const InstanceDetailLazy = lazy(
  () =>
    import(
      '@/pages/TasksManagement/TaskList/InstanceDetail/InstanceDetailPage'
    ),
);

const UserListLazy = lazy(
  () => import('@/pages/UsersManagement/UserList/UserListPage'),
);

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
export const DEFAULT_PRIVATE_PATH = '/rules_management/struct_rules';

// 需要鉴权的路由
const privateBaseRoutes: BaseRoute = [
  {
    key: '/tasks_management',
    element: <Outlet />,
    label: '任务管理',
    addToMenu: true,
    roles: [UserRole.Admin],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/tasks_management') {
        return redirect('/tasks_management/tasks');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:command" />,
    children: [
      {
        key: '/tasks_management/tasks',
        element: <TaskListLazy />,
        label: '任务列表',
        addToMenu: true,
        roles: [UserRole.Admin],
      },
      {
        key: '/tasks_management/tasks/detail/:taskUid',
        element: <TaskDetailLazy />,
        label: '任务详情',
        addToMenu: false,
        selectedKeys: ['/tasks_management/tasks'],
        roles: [UserRole.Admin],
      },
      {
        key: '/tasks_management/tasks/detail/:taskUid/:instanceUid',
        element: <InstanceDetailLazy />,
        label: '执行结果',
        addToMenu: false,
        selectedKeys: ['/tasks_management/tasks'],
        roles: [UserRole.Admin],
      },
    ],
  },
  {
    key: '/rules_management',
    element: <Outlet />,
    label: '规则配置',
    addToMenu: true,
    roles: [UserRole.Admin, UserRole.User],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/rules_management') {
        return redirect('/rules_management/struct_rules');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:file-editing-one" />,
    children: [
      {
        key: '/rules_management/struct_rules',
        element: <StructRulesLazy />,
        label: '结构化规则',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rules_management/struct_rules/:uid',
        selectedKeys: ['/rules_management/struct_rules'],
        element: <StructRuleDetailLazy />,
        label: '结构化规则详情',
        addToMenu: false,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rules_management/push_rules',
        element: <PushRulesLazy />,
        label: '推送规则',
        addToMenu: true,
        roles: [UserRole.Admin],
      },
      {
        key: '/rules_management/push_rules/:uid',
        selectedKeys: ['/rules_management/push_rules'],
        element: <PushRuleDetailLazy />,
        label: '推送规则详情',
        addToMenu: false,
        roles: [UserRole.Admin],
      },
      {
        key: '/rules_management/encode',
        element: <EncodeLazy />,
        label: '码表管理',
        addToMenu: true,
        roles: [UserRole.Admin, UserRole.User],
      },
      {
        key: '/rules_management/encode/:uid',
        selectedKeys: ['/rules_management/encode'],
        element: <EncodeDetailLazy />,
        label: '码表详情',
        addToMenu: false,
        roles: [UserRole.Admin, UserRole.User],
      },
    ],
  },
  {
    key: '/users_management',
    element: <Outlet />,
    label: '用户管理',
    addToMenu: true,
    roles: [UserRole.Admin],
    loader: ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === '/users_management') {
        return redirect('/users_management/user_list');
      }
      return null;
    },
    icon: <i className="i-icon-park-outline:file-editing-one" />,
    children: [
      {
        key: '/users_management/user_list',
        element: <UserListLazy />,
        label: '用户列表',
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
export const menuItems = privateBaseRoutes.reduce<
  Required<MenuProps>['items'][number][]
>((pre, cur) => {
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
        children: cur.children.filter((c) => role && c.roles.includes(role)),
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
