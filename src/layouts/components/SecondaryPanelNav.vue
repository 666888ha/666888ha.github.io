<template>
  <div class="secondary-panel-nav">
    <!-- 存在「二级分组」时：二级仅显示分类行，三级在右侧悬浮层展示 -->
    <template v-if="hoverFlyout">
      <template v-for="item in items" :key="item.path">
        <router-link
          v-if="!isNavGroup(item)"
          :to="item.path"
          class="secondary-row"
          :class="{ 'is-active': isRowActive(item) }"
        >
          <span class="secondary-row-text">{{ renderTitle(item.title) }}</span>
        </router-link>
        <div
          v-else
          class="secondary-row secondary-row--flyout-trigger"
          :class="{
            'is-active': isGroupActive(item),
            'is-flyout-open': flyoutGroup?.path === item.path,
          }"
          @mouseenter="(e) => openFlyout(item, e)"
          @mouseleave="scheduleCloseFlyout"
        >
          <span class="secondary-row-text">{{ renderTitle(item.title) }}</span>
          <t-icon name="chevron-right" class="secondary-row-chevron" />
        </div>
      </template>

      <Teleport to="body">
        <div
          v-show="flyoutGroup"
          class="secondary-flyout"
          :style="flyoutStyle"
          @mouseenter="cancelCloseFlyout"
          @mouseleave="scheduleCloseFlyout"
        >
          <template v-if="flyoutGroup">
            <div class="secondary-flyout__header">
              {{ renderTitle(flyoutGroup.title) }}
            </div>
            <div class="secondary-flyout__body">
              <div
                v-for="(sec, si) in flyoutSections"
                :key="si"
                class="secondary-flyout__section"
              >
                <div v-if="sec.groupTitle !== undefined" class="secondary-flyout__group-title">
                  {{ renderTitle(sec.groupTitle) }}
                </div>
                <div class="secondary-flyout__links">
                  <div
                    v-for="ext in sec.externalItems"
                    :key="ext.path"
                    class="secondary-flyout__link secondary-flyout__link--external"
                    @click="openHref(ext.href)"
                  >
                    {{ renderTitle(ext.title) }}
                  </div>
                  <router-link
                    v-for="linkItem in sec.routerItems"
                    :key="linkItem.path"
                    :to="linkItem.path"
                    class="secondary-flyout__link"
                    :class="{ 'is-active': isRowActive(linkItem) }"
                    @click="closeFlyout"
                  >
                    {{ renderTitle(linkItem.title) }}
                  </router-link>
                </div>
              </div>
            </div>
          </template>
        </div>
      </Teleport>
    </template>

    <!-- 无二级分组时：保持原有一级展平列表 -->
    <template v-else>
      <template v-for="(row, idx) in flatRows" :key="rowKey(row, idx)">
        <div v-if="row.kind === 'group'" class="secondary-group-title">
          {{ renderTitle(row.title) }}
        </div>
        <div
          v-else-if="externalHref(row.item)"
          class="secondary-row"
          @click="openHref(externalHref(row.item)![0])"
        >
          <span class="secondary-row-text">{{ renderTitle(row.item.title) }}</span>
        </div>
        <router-link
          v-else
          :to="row.item.path"
          class="secondary-row"
          :class="{ 'is-active': isRowActive(row.item) }"
        >
          <span class="secondary-row-text">{{ renderTitle(row.item.title) }}</span>
        </router-link>
      </template>
    </template>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useLocale } from '@/locales/useLocale';
import type { FlatNavRow, NavListItem } from '@/utils/menuNav';
import { flattenNavTree, flattenNavTreeForFlyout, getHref, isNavGroup } from '@/utils/menuNav';

const props = defineProps({
  items: {
    type: Array as PropType<NavListItem[]>,
    default: () => [],
  },
  /** 为 true 时：含子级的二级项悬停展示右侧三级悬浮层（适合销售统计等菜单较多的模块） */
  hoverFlyout: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const { locale } = useLocale();

const flatRows = computed(() => flattenNavTree(props.items));

const flyoutGroup = ref<NavListItem | null>(null);
const flyoutStyle = ref<Record<string, string>>({});

let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function scheduleCloseFlyout() {
  clearCloseTimer();
  closeTimer = setTimeout(() => {
    flyoutGroup.value = null;
    closeTimer = null;
  }, 200);
}

function cancelCloseFlyout() {
  clearCloseTimer();
}

function closeFlyout() {
  clearCloseTimer();
  flyoutGroup.value = null;
}

function openFlyout(item: NavListItem, e: MouseEvent) {
  cancelCloseFlyout();
  flyoutGroup.value = item;
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const margin = 8;
  const maxH = Math.max(160, window.innerHeight - r.top - margin);
  flyoutStyle.value = {
    position: 'fixed',
    left: `${r.right}px`,
    top: `${r.top}px`,
    maxHeight: `${maxH}px`,
    zIndex: '3000',
  };
}

type FlyoutSection = {
  groupTitle?: string | Record<string, string>;
  routerItems: NavListItem[];
  externalItems: { path: string; title: string | Record<string, string> | undefined; href: string }[];
};

function rowsToFlyoutSections(rows: FlatNavRow[]): FlyoutSection[] {
  const sections: FlyoutSection[] = [];
  let cur: FlyoutSection = { routerItems: [], externalItems: [] };

  const pushCur = () => {
    if (
      cur.groupTitle !== undefined ||
      cur.routerItems.length ||
      cur.externalItems.length
    ) {
      sections.push(cur);
    }
  };

  for (const row of rows) {
    if (row.kind === 'group') {
      pushCur();
      cur = { groupTitle: row.title, routerItems: [], externalItems: [] };
    } else if (row.kind === 'link' && row.item) {
      const h = getHref(row.item);
      if (h?.[0]) {
        cur.externalItems.push({
          path: row.item.path,
          title: row.item.title,
          href: h[0],
        });
      } else {
        cur.routerItems.push(row.item);
      }
    }
  }
  pushCur();
  return sections;
}

const flyoutSections = computed(() => {
  const g = flyoutGroup.value;
  if (!g?.children?.length) return [];
  return rowsToFlyoutSections(flattenNavTreeForFlyout(g.children));
});

watch(
  () => route.path,
  () => {
    closeFlyout();
  },
);

onUnmounted(() => {
  clearCloseTimer();
});

const rowKey = (row: { kind: string; item?: NavListItem; title?: unknown }, idx: number) => {
  if (row.kind === 'link' && row.item) return row.item.path;
  return `g-${idx}-${String(row.title)}`;
};

const renderTitle = (title: string | Record<string, string> | undefined) => {
  if (!title) return '';
  if (typeof title === 'string') return title;
  return title[locale.value] || title.zh_CN || '';
};

const externalHref = (item: NavListItem | undefined) => (item ? getHref(item) : undefined);

const isRowActive = (item: NavListItem) => {
  const p = route.path;
  if (p === item.path) return true;
  if (!item.children?.length) {
    return p.startsWith(`${item.path}/`);
  }
  return false;
};

const isGroupActive = (item: NavListItem) => {
  const p = route.path;
  if (p === item.path) return true;
  return p.startsWith(`${item.path}/`);
};

const openHref = (url: string) => {
  window.open(url);
  closeFlyout();
};
</script>

<style scoped lang="less">
.secondary-panel-nav {
  padding: 0 0 16px;
}

.secondary-group-title {
  padding: 8px 12px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  margin-bottom: 0;
}

.secondary-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--td-text-color-primary);
  font-size: 13px;
  border-bottom: 1px solid var(--td-component-border);
  text-decoration: none;
  transition: none;

  &:hover {
    background: var(--td-bg-color-container-hover);
  }

  &.is-active {
    color: var(--td-brand-color);
    background: var(--td-brand-color-light);
  }
}

.secondary-row--flyout-trigger {
  user-select: none;

  &.is-flyout-open {
    background: var(--td-brand-color-light);
    color: var(--td-brand-color);
  }
}

.secondary-row-chevron {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--td-text-color-placeholder);
  margin-left: 4px;
}

.secondary-row--flyout-trigger.is-active .secondary-row-chevron,
.secondary-row--flyout-trigger.is-flyout-open .secondary-row-chevron {
  color: var(--td-brand-color);
}

.secondary-row-text {
  flex: 1;
  min-width: 0;
  color: inherit;
}
</style>

<style lang="less">
/* Teleport 到 body，需全局类名 */
.secondary-flyout {
  min-width: 320px;
  max-width: min(520px, calc(100vw - 320px));
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
  box-shadow: var(--td-shadow-2);
  overflow: hidden;
  box-sizing: border-box;
}

.secondary-flyout__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.secondary-flyout__header::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--td-brand-color);
  flex-shrink: 0;
}

.secondary-flyout__body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px 16px 16px;
}

.secondary-flyout__section + .secondary-flyout__section {
  margin-top: 16px;
}

.secondary-flyout__group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--td-component-border);
}

.secondary-flyout__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  align-items: center;
}

.secondary-flyout__link {
  font-size: 13px;
  color: var(--td-brand-color);
  text-decoration: none;
  padding: 4px 0;
  line-height: 1.5;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    text-decoration: underline;
  }

  &.is-active {
    font-weight: 600;
    text-decoration: underline;
  }
}

.secondary-flyout__link--external {
  color: var(--td-brand-color);
}
</style>
