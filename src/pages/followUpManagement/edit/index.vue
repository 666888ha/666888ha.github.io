<template>
  <!-- 4. 替代原render函数：模板中传递props（注意kebab-case对应组件中的camelCase） -->
  <add :query-id="queryId" type="2" />
</template>
<script setup>
// 1. 导入必要依赖（Vue3 相关API + 组件）
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Add from '../components/add.vue';

// 2. 替代 this.$route：获取路由查询参数
const route = useRoute();
const router = useRouter();
const queryId = ref('');

// 3. 替代 created 钩子：使用 onMounted（Vue3组合式中，路由参数在onMounted中获取更稳定，效果等同于created）
onMounted(() => {
  const { id } = route.query; // 解构赋值，避免变量名冲突
  if (id && typeof id === 'string') {
    queryId.value = id;
  } else {
    MessagePlugin.warning('缺少客户ID参数，将返回列表页');
    router.replace('/followUpManagement/list');
  }
});
</script>
