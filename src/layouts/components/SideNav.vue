<template>
  <div :class="[sideNavCls, 'dual-pane-sidebar-wrap']">
    <div
      class="dual-pane-root"
      :class="{ 'dual-pane-root--collapsed': collapsed }"
      :style="rootStyle"
    >
      <div class="primary-rail">
        <div class="primary-rail-scroll">
          <div
            v-for="item in primaryList"
            :key="item.path"
            class="primary-item"
            :class="{ 'primary-item--active': isPrimaryActive(item) }"
            @click="onPrimaryClick(item)"
          >
            <template v-if="unwrapIcon(item)">
              <t-icon
                v-if="typeof unwrapIcon(item) === 'string'"
                :name="unwrapIcon(item) as string"
                class="primary-icon"
              />
              <component v-else :is="unwrapIcon(item)" class="primary-icon" />
            </template>
            <span class="primary-label">{{ renderTitle(item.title) }}</span>
          </div>
        </div>
      </div>
      <div v-if="!collapsed && showSecondary" class="secondary-panel">
        <SecondaryPanelNav :items="secondaryItems" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, onMounted, onUnmounted, ref, unref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { prefix } from '@/config/global';
import { useLocale } from '@/locales/useLocale';
import { useSettingStore } from '@/store';
import type { MenuRoute, ModeType } from '@/types/interface';
import {
  buildMenuList,
  getFirstLeafPath,
  getPrimaryPathForCurrentRoute,
  type NavListItem,
} from '@/utils/menuNav';

import SecondaryPanelNav from './SecondaryPanelNav.vue';

const props = defineProps({
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: () => [],
  },
  isFixed: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  layout: {
    type: String as PropType<string>,
    default: '',
  },
  theme: {
    type: String as PropType<ModeType>,
    default: 'light',
  },
  isCompact: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
});

const MIN_POINT = 992 - 1;

const settingStore = useSettingStore();
const collapsed = computed(() => settingStore.isSidebarCompact);
const route = useRoute();
const router = useRouter();
const { locale } = useLocale();

const primaryList = computed(() => buildMenuList(props.menu as MenuRoute[]));
const primaryPath = ref('');

const syncPrimaryFromRoute = () => {
  const list = primaryList.value;
  if (!list.length) return;
  const match = getPrimaryPathForCurrentRoute(route.path, list);
  primaryPath.value = match || list[0].path;
};

watch(
  () => route.path,
  () => {
    syncPrimaryFromRoute();
  },
  { immediate: true },
);

watch(primaryList, () => syncPrimaryFromRoute(), { deep: true });

const selectedPrimary = computed(() => primaryList.value.find((p) => p.path === primaryPath.value));

const showSecondary = computed(() => {
  const p = selectedPrimary.value;
  return !!(p?.children?.length && !p.meta?.single);
});

const secondaryItems = computed(() => {
  const p = selectedPrimary.value;
  if (!p?.children?.length || p.meta?.single) return [];
  return p.children;
});

const sidebarWidthPx = computed(() => {
  if (collapsed.value) return 72;
  if (showSecondary.value) return 280;
  return 72;
});

const rootStyle = computed(() => ({
  width: `${sidebarWidthPx.value}px`,
  minWidth: `${sidebarWidthPx.value}px`,
  transition: 'none',
}));

const unwrapIcon = (item: NavListItem) => unref(item.icon as any);

const renderTitle = (title: string | Record<string, string> | undefined) => {
  if (!title) return '';
  if (typeof title === 'string') return title;
  return title[locale.value] || title.zh_CN || '';
};

const isPrimaryActive = (item: NavListItem) => primaryPath.value === item.path;

/** 与 showSecondary 一致：存在子菜单且非 single 时展示二级面板 */
const hasSecondaryPanel = (item: NavListItem) => !!(item.children?.length && !item.meta?.single);

const onPrimaryClick = (item: NavListItem) => {
  primaryPath.value = item.path;
  // 收缩状态下点击带二级的一级菜单：展开侧栏以显示二级面板
  if (collapsed.value && hasSecondaryPanel(item)) {
    settingStore.updateConfig({ isSidebarCompact: false });
  }
  const target = getFirstLeafPath(item);
  if (route.path !== target) {
    router.push(target);
  }
};

const sideNavCls = computed(() => [
  `${prefix}-sidebar-layout`,
  'dual-pane-sidebar',
  {
    [`${prefix}-sidebar-compact`]: props.isCompact,
  },
]);

const autoCollapsed = () => {
  const isNarrow = window.innerWidth <= MIN_POINT;
  settingStore.updateConfig({
    isSidebarCompact: isNarrow,
  });
};

onMounted(() => {
  autoCollapsed();
  window.addEventListener('resize', autoCollapsed);
});

onUnmounted(() => {
  window.removeEventListener('resize', autoCollapsed);
});
</script>
<style lang="less" scoped>
.dual-pane-sidebar-wrap {
  height: 100%;
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dual-pane-root {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.primary-rail {
  width: 72px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 0 0 72px;
  background: #1a58aa;
  color: #fff;
}

.primary-rail-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.primary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  cursor: pointer;
  text-align: center;
  border-left: 3px solid transparent;
  transition: none;

  &:hover:not(.primary-item--active) {
    background: rgba(255, 255, 255, 0.1);
  }

  &--active {
    background: #fff;
    border-left-color: transparent;

    .primary-icon {
      color: #000 !important;
    }

    .primary-label {
      color: #000;
    }

    &:hover {
      background: #f3f3f3;
    }
  }
}

.primary-icon {
  font-size: 22px;
  margin-bottom: 4px;
  color: rgba(255, 255, 255, 0.92) !important;
}

.primary-label {
  font-size: 11px;
  line-height: 1.2;
  max-width: 100%;
  padding: 0 2px;
  word-break: break-all;
  color: rgba(255, 255, 255, 0.95);
}

.secondary-panel {
  width: 208px;
  flex: 0 0 208px;
  min-width: 0;
  min-height: 0;
  background: #fff;
  border-right: 1px solid var(--td-component-border);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: var(--td-scrollbar-color);
  }
}

</style>
