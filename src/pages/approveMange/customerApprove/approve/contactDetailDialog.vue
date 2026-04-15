<template>
  <!-- 联系人详情 -->
  <t-dialog
    v-model:visible="dialogVisible"
    header="联系人详情"
    width="50%"
    :close-on-overlay-click="false"
    :footer="false"
  >
    <base-desc label-width="150px">
      <base-desc-item label="联系人姓名">
        {{ detail.contact_name || '-' }}
      </base-desc-item>
      <base-desc-item label="角色">
        {{ detail.position || '-' }}
      </base-desc-item>
      <base-desc-item label="部门职务">
        {{ detail.role || '-' }}
      </base-desc-item>
      <base-desc-item label="固定电话">
        {{ detail.tel || '-' }}
      </base-desc-item>
      <base-desc-item label="电子邮箱">
        {{ detail.email || '-' }}
      </base-desc-item>
      <base-desc-item label="微信账号">
        {{ detail.wechat || '-' }}
      </base-desc-item>
      <base-desc-item label="详细地址">
        {{ detail.contact_address || '-' }}
      </base-desc-item>
      <base-desc-item label="尊称">
        {{ detail.honorific || '-' }}
      </base-desc-item>
      <base-desc-item label="生日">
        {{ detail.birthday || '-' }}
      </base-desc-item>
      <base-desc-item label="手机号码">
        {{ detail.mobile || '-' }}
      </base-desc-item>
      <base-desc-item label="传真号码">
        {{ detail.fax || '-' }}
      </base-desc-item>
      <base-desc-item label="所在地区">
        {{ detail.contact_region || '-' }}
      </base-desc-item>
      <base-desc-item label="备注">
        {{ detail.contact_remark || '-' }}
      </base-desc-item>
    </base-desc>
  </t-dialog>
</template>
<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';

const BaseDescItem = defineAsyncComponent(() => import('@/components/BaseDescItem/index.vue'));
const BaseDesc = defineAsyncComponent(() => import('@/components/BaseDesc/index.vue'));
// 弹框显隐状态
const dialogVisible = ref(false);

// 当前查看的跟进ID

// 跟进详情数据（接口返回）
const detail = ref<Record<string, any>>({});

// 父组件调用：传入列表记录，内部取 id 调接口
const show = (record: any) => {
  detail.value = record;
  dialogVisible.value = true;
};

defineExpose({
  show,
});
</script>
<style scoped lang="less">
/* 弹框内表单间距优化 */
:deep(.t-form-item) {
  margin-bottom: 10px;
}
/* 链接样式调整（与截图一致） */
:deep(.t-link) {
  color: #0052d9;
  cursor: pointer;
  text-decoration: underline;
}
</style>
