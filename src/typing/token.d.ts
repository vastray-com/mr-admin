declare namespace Tokens {
  // token 模型
  type Token = {
    uid: string;
    name: string;
    description?: string;
    value: string;
    created_at: string;
    updated_at: string;
  };
  type List = Token[];

  // 创建 token 参数
  type CreateParams = {
    name: string;
    description?: string;
  };

  // 删除 token 参数
  type DeleteParams = {
    uid: string;
  };
}
