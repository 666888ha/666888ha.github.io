<template>
  <follow-up-approve :is-approve="false" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  name: 'FollowUpApproveDetail',
});

const FollowUpApprove = defineAsyncComponent(() => import('../approve/index.vue'));
</script>
