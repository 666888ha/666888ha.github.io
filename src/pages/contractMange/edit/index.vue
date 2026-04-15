<template>
  <add-contract :query-id="queryId" />
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({
  name: 'EditContract',
});

const AddContract = defineAsyncComponent(() => import('../components/addContract.vue'));

const route = useRoute();
const router = useRouter();
const queryId = ref('');

onMounted(() => {
  const { id } = route.query;
  if (id && typeof id === 'string') {
    queryId.value = id;
  } else {
    MessagePlugin.warning('缺少合同ID参数，将返回列表页');
    router.replace('/contractMange/contractMange');
  }
});
</script>
