const SCRIPT_ID = 'amap-webapi-maps-v2';

let amapLoadPromise: Promise<unknown> | null = null;

/** 必须在「首次」拉取 AMap 脚本前设置，否则新申请的 Key 常出现瓦片不加载、仅灰底+Logo */
function applyAmapSecurityConfig(): void {
  if (typeof window === 'undefined') return;
  const code = (import.meta.env.VITE_AMAP_SECURITY_JS_CODE as string | undefined) || '';
  if (!code) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)._AMapSecurityConfig = { securityJsCode: code };
}

/** 动态加载高德 JS API 2.0，在 window.AMap 上可用 */
export function loadAmap(key: string): Promise<unknown> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('仅浏览器环境可加载高德地图'));
  }
  applyAmapSecurityConfig();
  const w = window as Window & { AMap?: unknown };
  if (w.AMap) return Promise.resolve(w.AMap);
  if (amapLoadPromise) return amapLoadPromise;
  amapLoadPromise = new Promise((resolve, reject) => {
    const done = (err?: Error) => {
      amapLoadPromise = null;
      if (err) {
        reject(err);
        return;
      }
      if (w.AMap) resolve(w.AMap);
      else reject(new Error('AMap 未定义'));
    };

    if (document.getElementById(SCRIPT_ID)) {
      const t0 = Date.now();
      const poll = setInterval(() => {
        if (w.AMap) {
          clearInterval(poll);
          done();
        } else if (Date.now() - t0 > 20000) {
          clearInterval(poll);
          done(new Error('高德地图加载超时'));
        }
      }, 40);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.onload = () => done();
    script.onerror = () => done(new Error('高德地图脚本加载失败，请检查网络与 Key 配置'));
    document.head.appendChild(script);
  });
  return amapLoadPromise;
}

/** 加载插件，如 AMap.PlaceSearch、AMap.Geocoder 等 */
export function useAmapPlugins(AMap: unknown, plugins: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!AMap) {
      reject(new Error('AMap 未就绪'));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AMap as any).plugin(plugins, () => resolve());
  });
}
