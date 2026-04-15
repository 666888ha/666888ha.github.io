<template>
  <div>
    <template v-if="setting.layout.value === 'side'">
      <t-layout key="side" :class="['layout-side-shell', mainLayoutCls]">
        <t-header class="layout-side-shell__header">
          <layout-header />
        </t-header>
        <t-layout class="layout-side-shell__body">
          <t-aside class="layout-side-shell__aside">
            <layout-side-nav />
          </t-aside>
          <t-content class="layout-side-shell__content">
            <layout-content />
          </t-content>
        </t-layout>
      </t-layout>
    </template>

    <template v-else>
      <t-layout key="no-side">
        <t-header><layout-header /> </t-header>
        <t-layout :class="mainLayoutCls">
          <layout-side-nav />
          <layout-content />
        </t-layout>
      </t-layout>
    </template>
    <setting-com />
  </div>
</template>
<script setup lang="ts">
import '@/style/layout.less';

import { storeToRefs } from 'pinia';
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import { prefix } from '@/config/global';
import { useSettingStore, useTabsRouterStore } from '@/store';

import LayoutContent from './components/LayoutContent.vue';
import LayoutHeader from './components/LayoutHeader.vue';
import LayoutSideNav from './components/LayoutSideNav.vue';
import SettingCom from './setting.vue';

const route = useRoute();
const settingStore = useSettingStore();
const tabsRouterStore = useTabsRouterStore();
const setting = storeToRefs(settingStore);

const mainLayoutCls = computed(() => [
  {
    't-layout--with-sider': settingStore.showSidebar,
  },
]);

const appendNewRoute = () => {
  const {
    path,
    query,
    meta: { title },
    name,
  } = route;
  tabsRouterStore.appendTabRouterList({ path, query, title: title as string, name, isAlive: true, meta: route.meta });
};

onMounted(() => {
  appendNewRoute();
});

watch(
  () => route.path,
  () => {
    appendNewRoute();
    document.querySelector(`.${prefix}-layout`).scrollTo({ top: 0, behavior: 'smooth' });
  },
);
</script>
<style lang="less" scoped>
/* 顶栏通栏全宽，下方再排侧栏 + 主内容 */
.layout-side-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-side-shell__header {
  flex-shrink: 0;
  width: 100%;
  padding: 0;
}

.layout-side-shell__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

/* 侧栏高度 = 整屏减去顶栏，避免随右侧主内容变高被撑开；二级菜单在 SideNav 内滚动 */
.layout-side-shell__aside {
  flex-shrink: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  width: fit-content;
  min-height: 0;
  height: calc(100vh - var(--td-comp-size-xxxl));
  max-height: calc(100vh - var(--td-comp-size-xxxl));
  overflow: hidden;
}

.layout-side-shell__aside > * {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.layout-side-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
