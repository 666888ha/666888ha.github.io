// 前端 roles 控制菜单权限 通过登录后的角色对菜单进行过滤处理
import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import router, { allRoutes } from '@/router';
import { store } from '@/store';

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
    routers: [],
    removeRoutes: [],
  }),
  actions: {
    async initRoutes(roles: Array<unknown>) {
      let accessedRouters = [];

      let removeRoutes: Array<RouteRecordRaw> = [];
      // special token - 如果 roles 包含 'all'，则显示所有路由
      console.log('roles', roles);
      if (roles.includes('all')) {
        accessedRouters = allRoutes;
      } else {
        const res = filterPermissionsRouters(allRoutes, roles);
        accessedRouters = res.accessedRouters;
        removeRoutes = res.removeRoutes;
      }

      this.routers = accessedRouters;
      this.removeRoutes = removeRoutes;

      // 移除没有权限的路由
      removeRoutes.forEach((item: RouteRecordRaw) => {
        if (router.hasRoute(item.name)) {
          router.removeRoute(item.name);
        }
      });
    },
    async restore() {
      // 恢复所有路由
      this.removeRoutes.forEach((item: RouteRecordRaw) => {
        router.addRoute(item);
      });
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}
