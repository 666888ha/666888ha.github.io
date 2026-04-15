<template>
  <t-dialog v-model:visible="dialogFormVisible" header="移入垃圾客户" :destroy-on-close="true" width="500px">
    <t-form :data="form">
      <t-form-item label="备注信息" name="desc">
        <t-textarea
          v-model="form.desc"
          placeholder="请输入备注信息"
          :autosize="{ minRows: 6 }"
          :maxlength="300"
          allow-input-over-max
        />
      </t-form-item>
    </t-form>

    <div class="tisi">* 转移到垃圾客户后此客户数据将属于公共资源，原归属人员不能再维护跟进和更新此客户数据。</div>
    <template #footer>
      <span class="dialog-footer">
        <t-button @click="dialogFormVisible = false">取消</t-button>
        <t-button theme="primary" :loading="loading" @click="handleConfirm">确定</t-button>
      </span>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

import { moveToWaste } from '@/api/customer/customer';

defineOptions({
  name: 'MoveToWasteDialog',
});
const emit = defineEmits<{
  success: [];
}>();

const dialogFormVisible = ref(false);
const loading = ref(false);
const customerIds = ref<(string | number)[]>([]);

const form = ref({
  desc: '', // 备注信息
});

const show = (ids: (string | number)[] | string | number) => {
  // 深拷贝数组，避免引用问题
  customerIds.value = Array.isArray(ids) && ids.length > 0 ? [...ids] : Array.isArray(ids) ? [...ids] : [ids];
  dialogFormVisible.value = true;
  form.value.desc = '';
};

const handleConfirm = async () => {
  if (!customerIds.value || customerIds.value.length === 0) {
    MessagePlugin.warning('请先选择要移入垃圾的客户');
    return;
  }
  loading.value = true;
  try {
    const response = await moveToWaste(customerIds.value, form.value.desc);
    if (response.code === 0 || response.code === 200) {
      MessagePlugin.success('移入垃圾客户成功');
      dialogFormVisible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(response.message || response.msg || '移入垃圾客户失败');
    }
  } catch (error: any) {
    console.error('移入垃圾客户失败:', error);
    MessagePlugin.error(error.message || '移入垃圾客户失败，请重试');
  } finally {
    loading.value = false;
  }
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.tisi {
  margin-top: 10px;
}
</style>
