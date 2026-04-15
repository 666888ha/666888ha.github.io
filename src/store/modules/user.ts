import { defineStore } from 'pinia';

import { usePermissionStore } from '@/store';
import type { UserInfo } from '@/types/interface';
import { HttpError } from '@/utils/error'; // 导入自定义错误类
import { request } from '@/utils/request';

const InitUserInfo: UserInfo = {
  name: '', // 用户名，用于展示在页面右上角头像处
  avatar: '',
  roles: [], // 前端权限模型使用 如果使用请配置modules/permission-fe.ts使用
};

export const useUserStore = defineStore('user', {
  state: () => ({
    token: 'main_token', // 默认token不走权限
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async login(userInfo: Record<string, unknown>) {
      try {
        const { username, password } = userInfo;

        // 使用项目的 request 工具调用登录接口
        // 直接使用 /api/login 路径，vite 代理会将 /api/login 转发到 http://senpucrm.kwsem.com/login
        const data = await request.post<any>({
          url: '/api/login',
          data: {
            username,
            password,
          },
          // 登录接口不需要token，所以禁用token携带
          requestOptions: {
            withToken: false,
            // 不进行响应转换，直接返回原始数据，这样我们可以拿到 code 和 message
            isTransformResponse: false,
          },
        } as any);

        // 打印响应数据用于调试
        console.log('登录接口响应:', data);

        // 判断响应是否成功 (code 为 0 或 200 表示成功)
        if (data && (data.code === 200 || data.code === 0)) {
          // 登录成功，保存token
          this.token = data.data?.token || 'main_token';

          // 保存用户信息
          if (data.data?.user_info) {
            // 提取 roles 信息，支持多种格式
            let roles: string[] = [];
            if (data.data.user_info.roles) {
              // 如果接口直接返回 roles 数组
              roles = Array.isArray(data.data.user_info.roles)
                ? data.data.user_info.roles
                : [data.data.user_info.roles];
            } else if (data.data.user_info.role_id) {
              // 如果只有 role_id，可以转换为 role 标识
              // 这里可以根据实际业务需求进行转换
              roles = [`role_${data.data.user_info.role_id}`];
            }

            this.userInfo = {
              name: data.data.user_info.real_name || data.data.user_info.username || '',
              roles,
              avatar: data.data.user_info.avatar || '',
              role_id: data.data.user_info.role_id,
              user_id: data.data.user_info.user_id,
            };
          }

          return {
            code: 200,
            message: data.msg || data.message || '登录成功',
            data: this.token,
          };
        } else {
          // 登录失败
          const errorMsg = data?.msg || data?.message || '登录失败，请检查用户名和密码';
          const errorCode = data?.code || 500;
          console.error('登录失败:', errorMsg, errorCode);
          throw new HttpError(errorMsg, errorCode);
        }
      } catch (error: any) {
        console.error('登录异常:', error);

        // 如果是我们自定义的错误，直接抛出
        if (error instanceof HttpError) {
          throw error;
        }

        // 网络错误或其他错误
        const errorMessage =
          error?.response?.data?.msg || error?.response?.data?.message || error?.message || '网络错误，请稍后重试';
        throw new HttpError(errorMessage, error?.response?.status || error?.code || 500);
      }
    },
    async getUserInfo() {
      const mockRemoteUserInfo = async (token: string) => {
        if (token === 'main_token') {
          return {
            name: 'Tencent',
            roles: ['all'], // 前端权限模型使用 如果使用请配置modules/permission-fe.ts使用
            avatar: '', // 添加 avatar 属性
            role_id: '', // 添加 role_id 属性
            user_id: '', // 添加▐
          };
        }
        return {
          name: this.userInfo.name,
          role_id: this.userInfo.role_id,
          user_id: this.userInfo.user_id,
          avatar: this.userInfo.avatar || '', // 确保 avatar 不为 undefined
          roles: ['all'], // 前端权限模型使用 如果使用请配置modules/permission-fe.ts使用
        };
      };
      const res = await mockRemoteUserInfo(this.token);

      this.userInfo = res;
    },
    async logout() {
      // 先清除本地状态，避免接口调用失败时影响用户体验
      this.token = '';
      this.userInfo = { ...InitUserInfo };

      try {
        // 调用退出登录接口
        // 如果接口不存在（404）或 token 已失效（401），静默处理
        await request.get<any>({
          url: '/api/logout',
          requestOptions: {
            withToken: false,
            isTransformResponse: false,
            // 禁用重试，避免多次调用
            retry: {
              count: 0,
              delay: 0,
            },
          },
        } as any);
      } catch (error: any) {
        // 静默处理所有错误（404、401 等），不显示错误提示
        // 本地状态已经在上面清除，这里只记录日志用于调试
        if (error?.response?.status !== 401 && error?.response?.status !== 404) {
          console.error('退出登录接口调用失败:', error);
        }
      }
    },

    // 更新用户头像
    updateAvatar(avatarUrl: string) {
      this.userInfo.avatar = avatarUrl;
    },
  },
  persist: {
    afterRestore: () => {
      // 在 afterRestore 中，this 上下文可能未正确绑定
      // 所以直接使用 useUserStore() 获取 store 实例
      const userStore = useUserStore();
      const permissionStore = usePermissionStore();
      // 使用保存的 roles 初始化路由
      const roles = userStore.userInfo?.roles || [];
      if (roles.length > 0) {
        permissionStore.initRoutes(roles);
      }
    },
    key: 'user',
    paths: ['token', 'userInfo'],
  },
});
