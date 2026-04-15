<template>
  <quotation-approve :is-approve="false" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  name: 'QuotationApproveDetail',
});

const QuotationApprove = defineAsyncComponent(() => import('../approve/index.vue'));
</script>
