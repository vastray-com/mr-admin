import { UserRole } from '@/typing/enum';

declare namespace User {
  // 用户模型
  type User = {
    uid: string;
    username: string;
    nickname: string;
    role: UserRole;
    role_name: string;
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
    clearAll: () => void;
  };
}
