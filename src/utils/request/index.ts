// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
import { AxiosHeaders, type AxiosInstance } from 'axios';
import isString from 'lodash/isString';
import merge from 'lodash/merge';

import { useUserStore } from '@/store';

import { VAxios } from './Axios';
import type { AxiosTransform, CreateAxiosOptions } from './AxiosTransform';
import { formatRequestDate, joinTimestamp, setObjToUrlParams } from './utils';

const env = import.meta.env.MODE || 'development';

// 如果是mock模式 或 没启用直连代理 就不配置host 会走本地Mock拦截 或 Vite 代理
const host = env === 'mock' || import.meta.env.VITE_IS_REQUEST_PROXY !== 'true' ? '' : import.meta.env.VITE_API_URL;

// 数据处理，方便区分多种处理方式
const transform: AxiosTransform = {
  // 处理请求数据。如果数据不是预期格式，可直接抛出错误
  transformRequestHook: (res, options) => {
    const { isTransformResponse, isReturnNativeResponse } = options;

    // 如果204无内容直接返回
    const method = res.config.method?.toLowerCase();
    if (res.status === 204 && ['put', 'patch', 'delete'].includes(method)) {
      return res;
    }

    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res;
    }
    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data;
    }

    // 错误的时候返回
    const { data } = res;
    if (!data) {
      throw new Error('请求接口错误');
    }

    // 二进制响应（导出文件等）：不按 JSON 业务 code 解析
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data;
    }

    //  这里 code为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { code } = data as Record<string, unknown>;

    // 检查是否为 401 未授权（token 过期）- 处理业务 code 为 401 的情况
    if (code === 401) {
      // 清除用户信息和 token
      const userStore = useUserStore();
      // 先清除本地状态，避免调用 logout 接口时再次触发 401
      userStore.token = '';
      userStore.userInfo = { name: '', roles: [], avatar: '' };

      // 立即跳转，不等待异步操作
      const currentPath = window.location.pathname + window.location.search;
      const hashPath = window.location.hash;

      // 构建完整的当前路径，包括hash部分
      let fullCurrentPath = currentPath;
      if (hashPath) {
        fullCurrentPath += hashPath;
      }

      // 提取应用基础路径（例如 /senpucrm）
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const basePath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '';

      // 构建登录页完整路径
      const loginPath = `${basePath}/#/login`;

      // 如果当前路径已经是登录页，不再重定向，避免循环
      if (fullCurrentPath.includes('/#/login')) {
        throw new Error((data as any).msg || (data as any).message || '未登录或 Token 无效');
      }

      // 提取实际的页面路径（去掉basePath和hash前缀）
      let redirectPath = '';
      if (hashPath && hashPath.startsWith('#')) {
        redirectPath = hashPath.substring(1); // 去掉#号
      } else {
        // 如果没有hash，使用路径部分（去掉basePath）
        redirectPath = currentPath.replace(basePath, '');
      }

      // 使用 window.location 强制刷新页面，确保组件重新加载
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectPath)}`;

      // 显示错误提示（在跳转前）
      import('tdesign-vue-next').then((tdesignModule) => {
        const { MessagePlugin } = tdesignModule;
        const errorMsg = (data as any).msg || (data as any).message || '未登录或 Token 无效';
        MessagePlugin.error(errorMsg);
      });

      throw new Error((data as any).msg || (data as any).message || '未登录或 Token 无效');
    }

    // 这里逻辑可以根据项目进行修改
    const hasSuccess = data && (code === 0 || code === 200);
    if (hasSuccess) {
      return data;
    }

    // 如果不是成功的 code，抛出错误
    throw new Error((data as any).msg || (data as any).message || `请求接口错误, 错误码: ${code}`);
  },

  // 请求前处理配置
  beforeRequestHook: (config, options) => {
    const { apiUrl, isJoinPrefix, urlPrefix, joinParamsToUrl, formatDate, joinTime = true } = options;

    // 实例默认 Content-Type 为 application/json 时，axios 会把 FormData 序列化成 JSON，后端收不到 multipart file
    if (config.data instanceof FormData) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Content-Type', false);
      config.headers = headers;
    }

    // 添加接口前缀
    if (isJoinPrefix && urlPrefix && isString(urlPrefix)) {
      config.url = `${urlPrefix}${config.url}`;
    }

    // 将baseUrl拼接
    if (apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`;
    }
    const params = config.params || {};
    const data = config.data || false;

    if (formatDate && data && !isString(data) && !(data instanceof FormData)) {
      formatRequestDate(data);
    }
    if (config.method?.toUpperCase() === 'GET') {
      if (!isString(params)) {
        // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
        config.params = Object.assign(params || {}, joinTimestamp(joinTime, false));
      } else {
        // 兼容restful风格
        config.url = `${config.url + params}${joinTimestamp(joinTime, true)}`;
        config.params = undefined;
      }
    } else if (!isString(params)) {
      if (formatDate) {
        formatRequestDate(params);
      }
      if (
        Reflect.has(config, 'data') &&
        config.data &&
        (Object.keys(config.data).length > 0 || data instanceof FormData)
      ) {
        config.data = data;
        config.params = params;
      } else {
        // 非GET请求如果没有提供data，则将params视为data
        config.data = params;
        config.params = undefined;
      }
      if (joinParamsToUrl) {
        config.url = setObjToUrlParams(config.url as string, { ...config.params, ...config.data });
      }
    } else {
      // 兼容restful风格
      config.url += params;
      config.params = undefined;
    }
    return config;
  },

  // 请求拦截器处理
  requestInterceptors: (config, options) => {
    // 请求之前处理config
    const userStore = useUserStore();
    const { token } = userStore;

    if (token && (config as Recordable)?.requestOptions?.withToken !== false) {
      // jwt token
      (config as Recordable).headers.Authorization = options.authenticationScheme
        ? `${options.authenticationScheme} ${token}`
        : token;
    }
    return config;
  },

  // 响应拦截器处理
  responseInterceptors: (res) => {
    return res;
  },

  // 响应错误处理
  responseInterceptorsCatch: async (error: any, instance: AxiosInstance) => {
    const requestUrl = error?.config?.url || '';
    const status = error?.response?.status;

    // 处理退出登录接口的错误（404 或其他错误）
    // 如果退出登录接口不存在或失败，直接清除本地状态，不重试
    if (requestUrl.includes('/api/logout')) {
      const userStore = useUserStore();
      userStore.token = '';
      userStore.userInfo = { name: '', roles: [] };
      // 静默处理，不显示错误提示，不重试
      return Promise.reject(error);
    }

    // 处理 HTTP 401 状态码（未授权）
    if (status === 401) {
      // 清除用户信息和 token
      const userStore = useUserStore();
      // 先清除本地状态，避免调用 logout 接口时再次触发 401
      userStore.token = '';
      userStore.userInfo = { name: '', roles: [] };

      // 立即跳转，不等待异步操作
      const currentPath = window.location.pathname + window.location.search;
      const hashPath = window.location.hash;

      // 构建完整的当前路径，包括hash部分
      let fullCurrentPath = currentPath;
      if (hashPath) {
        fullCurrentPath += hashPath;
      }

      // 提取应用基础路径（例如 /senpucrm）
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const basePath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '';

      // 构建登录页完整路径
      const loginPath = `${basePath}/#/login`;

      // 如果当前路径已经是登录页，不再重定向，避免循环
      if (fullCurrentPath.includes('/#/login')) {
        return Promise.reject(error);
      }

      // 提取实际的页面路径（去掉basePath和hash前缀）
      let redirectPath = '';
      if (hashPath && hashPath.startsWith('#')) {
        redirectPath = hashPath.substring(1); // 去掉#号
      } else {
        // 如果没有hash，使用路径部分（去掉basePath）
        redirectPath = currentPath.replace(basePath, '');
      }

      // 使用 window.location 强制刷新页面，确保组件重新加载
      window.location.href = `${loginPath}?redirect=${encodeURIComponent(redirectPath)}`;

      // 显示错误提示（在跳转前）
      const { MessagePlugin } = await import('tdesign-vue-next');
      const errorMsg = error?.response?.data?.msg || error?.response?.data?.message || '未登录或 Token 无效';
      MessagePlugin.error(errorMsg);

      return Promise.reject(error);
    }

    const { config } = error;
    if (!config || !config.requestOptions.retry) return Promise.reject(error);
    // 如果重试次数为 0，不重试
    if (config.requestOptions.retry.count === 0) {
      return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= config.requestOptions.retry.count) return Promise.reject(error);

    config.retryCount += 1;

    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve(config);
      }, config.requestOptions.retry.delay || 1);
    });
    config.headers = { ...config.headers, 'Content-Type': 'application/json' };
    return backoff.then((config) => instance.request(config));
  },
};

function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    merge(
      <CreateAxiosOptions>{
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // 例如: authenticationScheme: 'Bearer'
        authenticationScheme: 'Bearer',
        // 超时
        timeout: 10 * 1000,
        // 携带Cookie
        withCredentials: true,
        // 头信息
        headers: { 'Content-Type': 'application/json' },
        // 数据处理方式
        transform,
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 接口地址
          apiUrl: host,
          // 是否自动添加接口前缀（已禁用，直接使用完整路径）
          isJoinPrefix: false,
          // 接口前缀
          // 例如: https://www.baidu.com/api
          // urlPrefix: '/api'
          urlPrefix: import.meta.env.VITE_API_URL_PREFIX,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 是否加入时间戳
          joinTime: true,
          // 是否忽略请求取消令牌
          // 如果启用，则重复请求时不进行处理
          // 如果禁用，则重复请求时会取消当前请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          // 重试
          retry: {
            count: 0,
            delay: 1000,
          },
        },
      },
      opt || {},
    ),
  );
}
export const request = createAxios();
