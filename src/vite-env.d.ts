/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string; // 应用名称
  readonly VITE_APP_LOGO: string; // 应用 LOGO 路径（public 目录下，如 /ws_logo.svg）

  readonly VITE_API_URL: string; // 后端接口地址

  readonly VITE_WAREHOUSE_GREETINGS: string; // 仓库欢迎语
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
