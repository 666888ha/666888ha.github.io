export interface ImportMetaEnv {
  readonly VITE_IS_REQUEST_PROXY: string;
  readonly VITE_API_URL: string;
  readonly VITE_API_URL_PREFIX: string;
  /** 高德地图 Web JS API Key（客户地址检索 / 地图选点） */
  readonly VITE_AMAP_KEY?: string;
  /** 高德「安全密钥」，与 Key 同页申请；不配置时 Web 版常灰屏无瓦片 */
  readonly VITE_AMAP_SECURITY_JS_CODE?: string;
}
