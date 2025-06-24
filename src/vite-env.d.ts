/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string; // 应用名称

  readonly VITE_API_URL: string; // 后端接口地址
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
