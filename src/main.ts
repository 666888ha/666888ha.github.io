/* eslint-disable simple-import-sort/imports */
import { createApp } from 'vue';
import TDesign from 'tdesign-vue-next';

import App from './App.vue';
import router from './router';
import { store } from './store';
import i18n from './locales';

import 'tdesign-vue-next/es/style/index.css';
import '@/style/index.less';
import './permission';

// 高德 JS API：安全密钥须在任何动态加载 AMap 脚本前写入（新 Key 未配置则常见灰底、仅 Logo 无瓦片）
if (import.meta.env.VITE_AMAP_SECURITY_JS_CODE) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE,
  };
}

const app = createApp(App);

app.use(TDesign);
app.use(store);
app.use(router);
app.use(i18n);

app.mount('#app');
