// 侧栏菜单优先从后端 GET /system/menu（角色权限）构建；失败时回退到静态路由 + roles 过滤
import cloneDeep from 'lodash/cloneDeep';
import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import { getUserMenuTree } from '@/api/system/menu';
import router, { allRoutes, homepageRouterList } from '@/router';
import { store } from '@/store';
import type { MenuRoute } from '@/types/interface';
import { mapErpMenuTreeToSideRoutes, prependWorkbenchIfMissing } from '@/utils/menuFromApi';

function filterPermissionsRouters(routes: Array<RouteRecordRaw>, roles: Array<unknown>) {
  const res: Array<RouteRecordRaw> = [];
  const removeRoutes: Array<RouteRecordRaw> = [];
  routes.forEach((route) => {
    const children: Array<RouteRecordRaw> = [];
    route.children?.forEach((childRouter) => {
      const roleCode = childRouter.meta?.roleCode || childRouter.name;
      if (roles.includes(roleCode)) {
        children.push(childRouter);
      } else {
        removeRoutes.push(childRouter);
      }
    });
    if (children.length > 0) {
      route.children = children;
      res.push(route);
    }
  });
  return { accessedRouters: res, removeRoutes };
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    whiteListRouters: ['/login'],
    routers: [] as Array<RouteRecordRaw | MenuRoute>,
    removeRoutes: [] as Array<RouteRecordRaw>,
    /** 避免路由守卫与 pinia persist 重复请求菜单 */
    sideMenuInFlight: null as Promise<void> | null,
  }),
  actions: {
    /** 清空侧栏数据（登录页、退出登录时调用，确保下次重新拉 /system/menu） */
    clearSideMenu() {
      this.routers = [];
      this.removeRoutes = [];
      this.sideMenuInFlight = null;
    },

    /**
     * 从后端拉当前用户菜单树并写入 routers（含首页工作台）
     * 失败或非数组时回退 initRoutes（静态 roles 模型）
     */
    async initSideMenuFromApi(roles: Array<unknown>) {
      if (this.sideMenuInFlight) {
        return this.sideMenuInFlight;
      }
      this.sideMenuInFlight = (async () => {
        try {
          const res = (await getUserMenuTree()) as {
            code?: number;
            data?: unknown;
            msg?: string;
          };
          const ok = res && (res.code === 0 || res.code === 200);
          const tree = res?.data;
          if (ok && Array.isArray(tree) && tree.length > 0) {
            let side = mapErpMenuTreeToSideRoutes(tree as any);
            const wb = cloneDeep(homepageRouterList[0]) as unknown as MenuRoute;
            side = prependWorkbenchIfMissing(side, wb);
            this.routers = side as Array<RouteRecordRaw | MenuRoute>;
            this.removeRoutes = [];
            return;
          }
        } catch (e) {
          console.warn('[permission] initSideMenuFromApi failed, fallback to static routes', e);
        }
        await this.initRoutes(roles);
      })();
      try {
        await this.sideMenuInFlight;
      } finally {
        this.sideMenuInFlight = null;
      }
    },

    async initRoutes(roles: Array<unknown>) {
      let accessedRouters: Array<RouteRecordRaw> = [];

      let removeRoutes: Array<RouteRecordRaw> = [];
      if (roles.includes('all')) {
        accessedRouters = allRoutes;
      } else {
        const res = filterPermissionsRouters(allRoutes, roles);
        accessedRouters = res.accessedRouters;
        removeRoutes = res.removeRoutes;
      }

      this.routers = accessedRouters;
      this.removeRoutes = removeRoutes;

      removeRoutes.forEach((item: RouteRecordRaw) => {
        if (item.name && router.hasRoute(item.name)) {
          router.removeRoute(item.name);
        }
      });
    },
    async restore() {
      this.removeRoutes.forEach((item: RouteRecordRaw) => {
        if (item.name && !router.hasRoute(item.name)) {
          router.addRoute(item);
        }
      });
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}
