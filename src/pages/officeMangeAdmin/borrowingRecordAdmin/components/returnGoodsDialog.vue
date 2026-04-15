<template>
  <t-dialog
    v-model:visible="innerVisible"
    header="归还物品"
    width="520px"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @close="handleClose"
  >
    <template #body>
      <t-form :data="form" label-width="90px" label-align="right">
        <t-form-item label="归还数量" required-mark>
          <t-input-number v-model="form.return_num" :min="1" :max="maxReturn" style="width: 200px" />
          <div style="margin-top: 6px; color: #999">最多可归还：{{ maxReturn }}</div>
        </t-form-item>

        <t-form-item label="归还备注">
          <t-textarea
            v-model="form.remark"
            placeholder="请输入"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :maxlength="200"
            show-word-limit
          />
        </t-form-item>
      </t-form>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, reactive, watch } from 'vue';

import { returnOfficeGoods } from '@/api/office';

const props = defineProps<{
  visible: boolean;
  row?: any; // 主页面传进来的行数据，至少需要 goods_id、change_num、goods_name
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}>();

const innerVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});


const maxReturn = computed(() => {
  const n = Math.abs(Number(props.row?.change_num || 0));
  return n > 0 ? n : 1;
});

const form = reactive<{
  goods_id: string | number | null;
  return_num: number;
  remark: string;
}>({
  goods_id: null,
  return_num: 1,
  remark: '',
});

watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    console.log(props.row)
    form.goods_id = props.row?.goods_id ?? null;
    form.return_num = maxReturn.value; // 默认全额归还；如需默认 1，改成 1
    form.remark = '';
    console.log(form.goods_id)
  },
);

const handleClose = () => {
  innerVisible.value = false;
};

const handleConfirm = async () => {
  if (!form.goods_id) {
    MessagePlugin.error('缺少 goods_id，无法归还');
    return;
  }

  const num = Number(form.return_num);
  if (!Number.isFinite(num) || num < 1) {
    MessagePlugin.error('请输入正确的归还数量');
    return;
  }
  if (num > maxReturn.value) {
    MessagePlugin.error(`归还数量不能超过 ${maxReturn.value}`);
    return;
  }

  try {
    const res = await returnOfficeGoods({
      goods_id: form.goods_id,
      return_num: num,
      remark: (form.remark || '').trim(),
    });

    if (res.code === 0 || res.code === 200) {
      MessagePlugin.success(res.msg || '归还成功');
      innerVisible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res.msg || res.message || '归还失败');
    }
  } catch (e: any) {
    console.error(e);
    MessagePlugin.error(e?.message || '归还失败，请重试');
  }
};
</script>
