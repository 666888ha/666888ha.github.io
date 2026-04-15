import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import type { ConfigEnv, UserConfig } from 'vite';
import { loadEnv } from 'vite';
import { viteMockServe } from 'vite-plugin-mock';
import svgLoader from 'vite-svg-loader';

const CWD = process.cwd();

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv): UserConfig => {
  const { VITE_BASE_URL, VITE_API_URL_PREFIX } = loadEnv(mode, CWD);
  return {
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            hack: `true; @import (reference) "${path.resolve('src/style/variables.less')}";`,
          },
          math: 'strict',
          javascriptEnabled: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      outDir: 'senpucrm',
    },
    plugins: [
      vue(),
      vueJsx(),
      viteMockServe({
        mockPath: 'mock',
        enable: true,
      }),
      svgLoader(),
    ],

    server: {
      port: 3002,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://senpucrm.kwsem.com',
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
};
