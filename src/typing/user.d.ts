import type { UserRole } from '@/typing/enum';

declare namespace User {
  // 用户模型
  type User = {
    uid: string;
    username: string;
    nickname: string;
    role: UserRole;
    role_name: string;
    status: 'active' | 'frozen';
    status_name: string;
    can_freeze: boolean;
    can_unfreeze: boolean;
    created_at?: string;
    updated_at?: string;
  };
  type List = User[];
  type ListParams = PaginationParams & {
    status?: 'all' | 'active' | 'frozen';
  };

  // 登录参数
  type LoginParams = {
    username: string;
    password: string;
  };

  // 登录响应
  type LoginRes = {
    token: string;
    user: User;
  };

  // 创建用户参数
  type CreateParams = {
    username: string;
    password: string;
    nickname?: string;
    role: UserRole;
  };

  // 批量创建用户参数
  type BatchCreateParamsFE = {
    usernames: string;
    password: string;
  };
  type BatchCreateParams = {
    usernames: string[];
    password: string;
  };

  // 修改密码参数
  type ChangePwdParams = {
    opwd: string;
    npwd: string;
    re_npwd: string;
  };

  // 重置密码参数
  type ResetPwdParams = {
    username: string;
    pwd: string;
  };

  // 冻结用户参数
  type FreezeParams = {
    uid: string;
  };

  // 解冻用户参数
  type UnfreezeParams = {
    uid: string;
  };

  // ls utils
  type LSUtil = {
    token: {
      get: () => string;
      set: (value: string) => void;
      clear: () => void;
    };
    user: {
      get: () => User;
      set: (value: User) => void;
      clear: () => void;
    };
    apiKey: {
      get: () => string;
      set: (value: string) => void;
      clear: () => void;
    };
    clearAll: () => void;
  };
}
