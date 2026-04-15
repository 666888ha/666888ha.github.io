<template>
  <add-contract />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

defineOptions({
  name: 'AddContract',
});

const AddContract = defineAsyncComponent(() => import('../components/addContract.vue'));
</script>
