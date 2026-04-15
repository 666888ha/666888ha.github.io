<template>
  <t-breadcrumb max-item-width="150" class="tdesign-breadcrumb">
    <t-breadcrumbItem v-for="item in crumbs" :key="item.to" :to="item.to">
      {{ item.title }}
    </t-breadcrumbItem>
  </t-breadcrumb>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useLocale } from '@/locales/useLocale';
import type { RouteMeta } from '@/types/interface';

const { locale } = useLocale();
const route = useRoute();

const crumbs = computed(() => {
  const pathArray = route.path.split('/');
  pathArray.shift(); // 移除空字符串

  const breadcrumbs = [];
  let currentPath = '';

  // 遍历路径部分，构建面包屑
  for (let i = 0; i < pathArray.length; i++) {
    const pathPart = pathArray[i];
    currentPath += `/${pathPart}`;

    // 找到匹配当前路径的路由
    let matchedRoute = route.matched.find((route) => route.path === currentPath);

    // 如果没有直接匹配，尝试查找父路由（处理嵌套路径的情况）
    if (!matchedRoute) {
      // 构建可能的父路径
      let parentPath = currentPath;
      while (parentPath !== '/' && !matchedRoute) {
        parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
        matchedRoute = route.matched.find((route) => route.path === parentPath);
      }
    }

    // 跳过隐藏面包屑的路由
    if (matchedRoute && matchedRoute.meta?.hiddenBreadcrumb) {
      continue;
    }

    let title = pathPart;

    // 处理最后一级
    if (i === pathArray.length - 1) {
      // 优先使用当前路由的 meta.title
      if (route.meta?.title) {
        if (typeof route.meta.title === 'string') {
          title = route.meta.title;
        } else {
          title = route.meta.title[locale.value];
        }
      } else if (matchedRoute?.meta?.title) {
        // 其次使用匹配到的路由的 meta.title
        if (typeof matchedRoute.meta.title === 'string') {
          title = matchedRoute.meta.title;
        } else {
          title = matchedRoute.meta.title[locale.value];
        }
      }
    }
    // 处理中间级（二级）
    else if (i === 1 && pathArray.length === 3) {
      // 优先使用最后一级路由的 parent_name
      if (route.meta?.parent_name) {
        title = route.meta.parent_name;
      } else if (matchedRoute?.meta?.title) {
        // 其次使用匹配到的路由的 meta.title
        if (typeof matchedRoute.meta.title === 'string') {
          title = matchedRoute.meta.title;
        } else {
          title = matchedRoute.meta.title[locale.value];
        }
      }
    }
    // 处理其他级
    else if (matchedRoute?.meta?.title) {
      // 使用匹配到的路由的 meta.title
      if (typeof matchedRoute.meta.title === 'string') {
        title = matchedRoute.meta.title;
      } else {
        title = matchedRoute.meta.title[locale.value];
      }
    }

    breadcrumbs.push({
      path: pathPart,
      to: currentPath,
      title,
    });
  }

  return breadcrumbs;
});
</script>
<style scoped>
.tdesign-breadcrumb {
  margin-bottom: 24px;
}
</style>
