<template>
  <div class="sales-stat-placeholder">
    <t-card :title="pageTitle" bordered>
      <p class="tip">{{ pageTitle }}</p>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useLocale } from '@/locales/useLocale';

const route = useRoute();
const { locale } = useLocale();
const pageTitle = computed(() => {
  const t = route.meta?.title;
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object') return t[locale.value] || t.zh_CN || '';
  return '';
});
</script>
<style scoped lang="less">
.sales-stat-placeholder {
  padding: 16px;
}
.tip {
  margin: 0;
  color: var(--td-text-color-secondary);
}
</style>
