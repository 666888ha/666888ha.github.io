<template>
  <workReport-approve :is-approve="true" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  name: 'WorkReportApproveDetail',
});

const workReportApprove = defineAsyncComponent(() => import('../detail/index.vue'));
</script>
