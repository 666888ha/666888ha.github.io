import { request } from '@/utils/request';

import type { ErpMenuNode } from '@/utils/menuFromApi';

/** 超级管理员：全量菜单树（角色权限弹窗用，与后端 system/menus/list 一致） */
export const getMenuList = () => {
  return request.get<any>({
    url: '/api/system/menus/list',
  });
};

/** 当前登录用户：按角色从 erp_role_menu 过滤后的菜单树（侧栏用） */
export const getUserMenuTree = () => {
  return request.get<{ code: number; msg?: string; data: ErpMenuNode[] }>({
    url: '/api/system/menu',
  });
};
