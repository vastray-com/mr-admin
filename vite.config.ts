import path from 'node:path';
import react from '@vitejs/plugin-react-oxc';
import UnoCSS from 'unocss/vite';
import { defineConfig, loadEnv } from 'vite';

const BUILD_DIR = 'dist';
const ENV_DIR = './env';
const getOutDir = (mode: string) => `${BUILD_DIR}/${mode}`;

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), ENV_DIR));

  return {
    build: { outDir: getOutDir(mode ?? 'default') },
    envDir: ENV_DIR,
    plugins: [react(), UnoCSS()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // port: 443,
      proxy: {
        '/api': {
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          target: env.VITE_API_URL ?? 'http://localhost:3000',
        },
      },
    },
  };
});
