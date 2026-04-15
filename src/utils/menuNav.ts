import type { MenuRoute } from '@/types/interface';

export type NavListItem = MenuRoute & {
  path: string;
  title?: string | Record<string, string>;
  icon?: unknown;
  children?: NavListItem[];
  redirect?: string;
};

export function buildMenuList(list: MenuRoute[] | undefined, basePath?: string): NavListItem[] {
  if (!list?.length) return [];
  const sorted = [...list].sort((a, b) => (a.meta?.orderNo || 0) - (b.meta?.orderNo || 0));
  return sorted
    .map((item) => {
      const path =
        basePath && !String(item.path).includes(basePath) ? `${basePath}/${item.path}` : item.path;
      return {
        ...item,
        path,
        title: item.meta?.title,
        icon: item.meta?.icon,
        children: buildMenuList(item.children, path),
        meta: item.meta,
        redirect: item.redirect,
      };
    })
    .filter((item) => item.meta && item.meta.hidden !== true);
}

/** 进入该模块时的默认落地路径（含 single 单页） */
export function getFirstLeafPath(item: NavListItem): string {
  if (item.meta?.single && item.children?.length) {
    return getFirstLeafPath(item.children[0]);
  }
  if (!item.children?.length) {
    return item.path;
  }
  const visible = item.children.filter((c) => !c.meta?.hidden);
  if (!visible.length) return item.path;
  return getFirstLeafPath(visible[0]);
}

export function getPrimaryPathForCurrentRoute(routePath: string, primaries: NavListItem[]): string {
  let best = '';
  for (const m of primaries) {
    if (routePath === m.path || routePath.startsWith(`${m.path}/`)) {
      if (m.path.length > best.length) best = m.path;
    }
  }
  return best || primaries[0]?.path || '';
}

export function getHref(item: NavListItem) {
  const { frameSrc, frameBlank } = item.meta || {};
  if (frameSrc && frameBlank) {
    return frameSrc.match(/(https?):\/\/([\w.]+)(?:\/\S*)?/);
  }
  return null;
}

export function isNavGroup(item: NavListItem) {
  return !!(item.children?.length && !item.meta?.single);
}

/** 将树形菜单展平为「分组标题 + 链接」行，避免递归组件循环依赖 */
export type FlatNavRow =
  | { kind: 'group'; title: string | Record<string, string> | undefined }
  | { kind: 'link'; item: NavListItem };

export function flattenNavTree(items: NavListItem[]): FlatNavRow[] {
  const out: FlatNavRow[] = [];
  for (const item of items) {
    if (isNavGroup(item)) {
      out.push({ kind: 'group', title: item.title });
      out.push(...flattenNavTree(item.children));
    } else {
      out.push({ kind: 'link', item });
    }
  }
  return out;
}
