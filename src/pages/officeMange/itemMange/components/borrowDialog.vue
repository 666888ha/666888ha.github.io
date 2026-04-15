<template>
  <t-dialog
    v-model:visible="visible"
    header="借出物品"
    :width="600"
    :close-on-overlay-click="false"
    @close="handleClose"
  >
    <template #body>
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-width="100px"
        label-align="top"
        @submit="handleSubmit"
      >
        <t-form-item label="借出数量" name="change_num" required>
          <t-input-number
            v-model="formData.change_num"
            :min="1"
            theme="column"
            placeholder="请输入借出数量"
            style="width: 100%"
          />
        </t-form-item>

        <t-form-item label="借出备注" name="remark" required>
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入借出备注（需填借出对象/预计归还时间）"
            :maxlength="500"
            :autosize="{ minRows: 4, maxRows: 8 }"
            show-word-limit
          />
        </t-form-item>
      </t-form>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <t-button @click="handleCancel">取消</t-button>
        <t-button theme="primary" @click="handleSubmitClick">确认</t-button>
      </span>
    </template>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormRules, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, reactive, ref } from 'vue';

import { borrowOfficeGoods } from '@/api/office';

defineOptions({
  name: 'BorrowDialog',
});

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const formRef = ref();
const goodsId = ref<number | string>('');

const formData = reactive({
  goods_id: '',
  change_num: 1,
  remark: '',
});

const formRules: FormRules = {
  goods_id: [{ required: true, message: '物品ID不能为空', type: 'error', trigger: 'blur' }],
  change_num: [
    { required: true, message: '请输入借出数量', type: 'error', trigger: 'blur' },
    {
      validator: (val: number) => {
        if (val <= 0) {
          return { result: false, message: '借出数量必须大于0', type: 'error' };
        }
        return { result: true, message: '', type: 'success' };
      },
      trigger: 'blur',
    },
  ],
  remark: [
    { required: true, message: '请输入借出备注', type: 'error', trigger: 'blur' },
    { max: 500, message: '借出备注不能超过500个字符', type: 'error', trigger: 'blur' },
  ],
};

const show = (id: number | string, goodsName?: string) => {
  goodsId.value = id;
  formData.goods_id = String(id);
  formData.change_num = 1;
  formData.remark = '';
  visible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const handleClose = () => {
  visible.value = false;
};

const handleCancel = () => {
  handleClose();
};

const handleSubmitClick = () => {
  formRef.value?.submit();
};

const handleSubmit = async ({ validateResult, firstError }: SubmitContext) => {
  if (validateResult === true) {
    if (!goodsId.value) {
      MessagePlugin.error('物品ID不能为空');
      return;
    }
    try {
      const response = await borrowOfficeGoods({
        goods_id: String(goodsId.value),
        change_num: String(formData.change_num),
        remark: formData.remark.trim(),
      });
      if (response.code === 0 || response.code === 200) {
        MessagePlugin.success('借出成功');
        handleClose();
        emit('success');
      } else {
        MessagePlugin.error(response.message || response.msg || '借出失败');
      }
    } catch (error: any) {
      console.error('借出物品失败:', error);
      MessagePlugin.error(error.message || '借出失败，请重试');
    }
  } else {
    MessagePlugin.warning(firstError || '请完善表单信息');
  }
};

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
