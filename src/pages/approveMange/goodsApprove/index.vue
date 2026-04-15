<template>
  <div class="work-order-page-container">
    <t-tabs v-model="activeTab" class="work-order-tabs">
      <t-tab-panel value="borrowing" label="领用申请">
        <borrowing-application v-if="activeTab === 'borrowing'" />
      </t-tab-panel>

      <t-tab-panel value="return" label="资产归还">
        <return-the-items v-if="activeTab === 'return'" />
      </t-tab-panel>
    </t-tabs>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

import BorrowingApplication from './components/borrowingApplication.vue';
import ReturnTheItems from './components/ReturnTheItems.vue';

defineOptions({
  name: 'GoodsApprove',
});

const activeTab = ref<'borrowing' | 'return'>('borrowing');
</script>
<style scoped>
.work-order-page-container {
  padding: 20px;
  background: #fff;
}

.work-order-tabs {
  margin-bottom: 16px;
}
</style>
