<template>
  <customer-approve :is-approve="false" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  name: 'CustomerApproveDetail',
});

const CustomerApprove = defineAsyncComponent(() => import('../approve/index.vue'));
</script>
