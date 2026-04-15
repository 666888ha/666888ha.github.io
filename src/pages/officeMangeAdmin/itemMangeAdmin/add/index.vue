<template>
  <office-item-add mode="add" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const OfficeItemAdd = defineAsyncComponent(() => import('../components/addItem.vue'));
</script>
