<template>
  <t-card :bordered="false" class="info-card">
    <base-desc label-width="150px">
      <t-row type="flex">
        <base-desc-item label="物品编码">
          {{ followDetail.goods_code || '-' }}
        </base-desc-item>
        <base-desc-item label="物品名称">
          {{ followDetail.goods_name || '-' }}
        </base-desc-item>
      </t-row>
      <t-row type="flex">
        <base-desc-item label="物品分类">
          {{ followDetail.goods_cate || '-' }}
        </base-desc-item>
        <base-desc-item label="物品属性">
          {{ followDetail.goods_attr || '-' }}
        </base-desc-item>
      </t-row>
      <t-row type="flex">
        <base-desc-item label="物品位置">
          {{ followDetail.goods_location }}
        </base-desc-item>
        <base-desc-item label="物库存数量">
          {{ followDetail.stock_num }}
        </base-desc-item>
      </t-row>
      <base-desc-item label="物品照片">
        <t-link
          v-for="(item, index) in followDetail.goods_img"
          :key="index"
          theme="primary"
          hover="underline"
          :href="item"
          target="_blank"
        >
          {{ item }}
        </t-link>
      </base-desc-item>
      <base-desc-item label="备注信息">
        {{ followDetail.remark }}
      </base-desc-item>
    </base-desc>
  </t-card>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { defineAsyncComponent, onMounted, ref } from 'vue';

const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
const followDetail = ref<Record<string, any>>({});
import { useRoute } from 'vue-router';

import { getOfficeGoodsDetail } from '@/api/office';

const route = useRoute();
// 加载详情
const loadFollowDetail = async () => {
  const id = route.query.id as string | undefined;
  if (!id) return;
  try {
    const res = await getOfficeGoodsDetail(id);
    if (res.code === 0 || res.code === 200) {
      // 处理物品照片数组
      followDetail.value = res.data || {};
      followDetail.value.goods_img = res.data.goods_img.split(',');
    } else {
      MessagePlugin.error(res.msg || '获取物品详情失败');
    }
  } catch (error: any) {
    console.error('获取物品详情失败:', error);
    MessagePlugin.error('获取物品详情失败，请重试');
  }
};

onMounted(() => {
  loadFollowDetail();
});
</script>
