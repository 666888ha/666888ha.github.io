<template>
  <office-item-add mode="edit" />
</template>
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const OfficeItemAdd = defineAsyncComponent(() => import('../components/addItem.vue'));
</script>
