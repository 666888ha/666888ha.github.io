<template>
  <div class="secondary-panel-nav">
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
  </div>
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useLocale } from '@/locales/useLocale';
import type { NavListItem } from '@/utils/menuNav';
import { flattenNavTree, getHref } from '@/utils/menuNav';

const props = defineProps({
  items: {
    type: Array as PropType<NavListItem[]>,
    default: () => [],
  },
});

const route = useRoute();
const { locale } = useLocale();

const flatRows = computed(() => flattenNavTree(props.items));

const rowKey = (row: { kind: string; item?: NavListItem; title?: unknown }, idx: number) => {
  if (row.kind === 'link' && row.item) return row.item.path;
  return `g-${idx}-${String(row.title)}`;
};

const renderTitle = (title: string | Record<string, string> | undefined) => {
  if (!title) return '';
  if (typeof title === 'string') return title;
  return title[locale.value] || title.zh_CN || '';
};

const externalHref = (item: NavListItem) => getHref(item);

const isRowActive = (item: NavListItem) => {
  const p = route.path;
  if (p === item.path) return true;
  if (!item.children?.length) {
    return p.startsWith(`${item.path}/`);
  }
  return false;
};

const openHref = (url: string) => {
  window.open(url);
};
</script>
<style scoped lang="less">
/* 顶部与左侧一级菜单第一项（如首页）对齐，不再额外下移 */
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

.secondary-row-text {
  flex: 1;
  min-width: 0;
  color: inherit;
}
</style>
