import {
  ChartBarIcon,
  CheckCircleIcon,
  FileIcon,
  FolderIcon,
  SystemSettingIcon,
  TimeIcon,
  UserBusinessIcon,
  UsergroupIcon,
  WorkIcon,
  WorkOffIcon,
} from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

import type { MenuRoute } from '@/types/interface';

/** 后端 /system/menu 单条（ThinkPHP 返回字段名） */
export interface ErpMenuNode {
  id: number;
  parent_id: number;
  menu_name: string;
  menu_url: string;
  menu_icon: string;
  sort: number;
  is_show?: number;
  create_time?: string;
  children?: ErpMenuNode[];
}

/** erp_menu.menu_icon 与 TDesign 导出组件名对应（未知则交给 t-icon 的 name 字符串） */
const MENU_ICON_COMPONENTS: Record<string, object> = {
  UsergroupIcon,
  TimeIcon,
  FileIcon,
  FolderIcon,
  CheckCircleIcon,
  WorkIcon,
  WorkOffIcon,
  UserBusinessIcon,
  SystemSettingIcon,
  ChartBarIcon,
};

function menuIconFromString(iconName: string | undefined): unknown {
  const raw = (iconName || '').trim();
  if (!raw) return undefined;
  const comp = MENU_ICON_COMPONENTS[raw];
  if (comp) return shallowRef(comp);
  return raw;
}

/**
 * 把 erp_menu 树转成与 Layout 侧栏一致的 MenuRoute（path 使用完整 menu_url，与 vue-router 中 path 一致）
 */
export function mapErpMenuTreeToSideRoutes(nodes: ErpMenuNode[] | undefined): MenuRoute[] {
  if (!nodes?.length) return [];

  const sorted = [...nodes].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  return sorted.map((n) => {
    const path = (n.menu_url || '').trim() || '/';
    const children = n.children?.length ? mapErpMenuTreeToSideRoutes(n.children) : [];
    const icon = menuIconFromString(n.menu_icon);
    const route: MenuRoute = {
      path,
      name: `menu_${n.id}`,
      children,
      meta: {
        title: { zh_CN: n.menu_name, en_US: path },
        orderNo: n.sort ?? 0,
        hidden: n.is_show === 0,
        icon: icon as MenuRoute['meta']['icon'],
      },
    };
    return route;
  });
}

/** 若接口未返回首页，则把工作台插到最前（与 router/modules/homepage 一致） */
export function prependWorkbenchIfMissing(
  routes: MenuRoute[],
  workbenchTemplate: MenuRoute,
): MenuRoute[] {
  const hasWb = routes.some((r) => r.path === '/workbench' || r.path.startsWith('/workbench'));
  if (hasWb) return routes;
  return [workbenchTemplate, ...routes];
}
