import 'nprogress/nprogress.css'; // progress bar style

import NProgress from 'nprogress'; // progress bar
import { MessagePlugin } from 'tdesign-vue-next';
import type { RouteRecordRaw } from 'vue-router';

import router from '@/router';
import { getPermissionStore, useUserStore } from '@/store';
import { PAGE_NOT_FOUND_ROUTE } from '@/utils/route/constant';

NProgress.configure({ showSpinner: false });

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  const permissionStore = getPermissionStore();
  const { whiteListRouters } = permissionStore;

  const userStore = useUserStore();

  // 如果是登录页，直接放行
  if (to.path === '/login') {
    // 如果已经有 token，清除它（可能是从其他页面跳转过来的）
    if (userStore.token) {
      userStore.token = '';
      userStore.userInfo = { name: '', roles: [], id: '' };
      permissionStore.clearSideMenu();
      permissionStore.restore();
    }
    next();
    NProgress.done();
    return;
  }

  if (userStore.token) {
    try {
      await userStore.getUserInfo();

      // 获取用户 roles
      const roles = userStore.roles || [];

      // 侧栏菜单：优先 GET /system/menu；失败再回退静态 initRoutes（roles）
      if (permissionStore.routers.length === 0) {
        await permissionStore.initSideMenuFromApi(roles);
      }

      // 通过 name 或 path 判断路由是否存在，避免新增路由但是 name 未匹配时直接被重定向到首页
      const routeExistsByName = to.name ? router.hasRoute(to.name) : false;
      const routeExistsByPath = router.resolve(to.fullPath).matched.length > 0;
      const routeExists = routeExistsByName || routeExistsByPath;

      if (to.name === PAGE_NOT_FOUND_ROUTE.name) {
        // 如果是 404 路由，重定向到工作台
        next({ path: '/workbench/workbench', replace: true });
      } else if (routeExists) {
        // 路由存在，正常放行
        next();
      } else {
        // 如果路由不存在，重定向到工作台
        next('/workbench/workbench');
      }
    } catch (error) {
      MessagePlugin.error(error.message);
      // 清除 token，确保能正确跳转到登录页
      userStore.token = '';
      userStore.userInfo = { name: '', roles: [] };
      permissionStore.clearSideMenu();
      permissionStore.restore();
      next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
        replace: true,
      });
      NProgress.done();
    }
  } else {
    /* white list router */
    if (whiteListRouters.includes(to.path)) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
        replace: true,
      });
    }
    NProgress.done();
  }
});

router.afterEach((to, from) => {
  // 只有在从非登录页跳转到登录页时才清除状态
  // 避免在登录页内部重定向时重复清除
  if (to.path === '/login' && from.path !== '/login') {
    const userStore = useUserStore();
    const permissionStore = getPermissionStore();

    // 只清除本地状态，不调用 logout 接口，避免触发 401 循环
    userStore.token = '';
    userStore.userInfo = { name: '', roles: [] };
    permissionStore.clearSideMenu();
    permissionStore.restore();
  }
  NProgress.done();
});
