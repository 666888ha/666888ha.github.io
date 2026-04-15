<template>
  <t-dialog v-model:visible="dialogFormVisible" :header="dialogTitle" :destroy-on-close="true" width="500px">
    <t-form :data="form">
      <!-- 归属人（仅在移出公海时显示） -->
      <t-form-item v-if="isMoveOut" label="归属人" name="owner_user_id" required>
        <t-select
          v-model="form.owner_user_id"
          placeholder="请选择归属人"
          clearable
          :options="personnelOptions"
          :loading="loadingPersonnel"
        />
      </t-form-item>
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

    <div class="tisi">
      <template v-if="isMoveOut">
        * 移出公海后此客户将重新分配给当前归属人员，可以正常维护跟进和更新此客户数据。
      </template>
      <template v-else> * 转移到公海后此客户数据将属于公共资源，原归属人员不能再维护跟进和更新此客户数据。 </template>
    </div>
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
import { computed, onMounted, ref } from 'vue';

import { getEmployeeList, moveOutPublicSea, moveToPublicSea } from '@/api/customer/customer';

defineOptions({
  name: 'OpenSeaDialog',
});
const props = defineProps<{
  isMultiple: boolean; // 是否是批量移入移出公海
  customerStatus?: number; // 客户状态：1-正常，2-公海，3-垃圾
  ownerUserId?: number | string; // 当前客户归属人ID
}>();
const emit = defineEmits<{
  success: [];
}>();

const dialogFormVisible = ref(false);
const loading = ref(false);
const customerIds = ref<(string | number)[]>([]);
const currentCustomerStatus = ref<number>(1); // 当前客户状态

// 人员选项
const personnelOptions = ref<Array<{ label: string; value: string | number }>>([]);
// 加载状态
const loadingPersonnel = ref(false);

// 根据客户状态计算对话框标题
const dialogTitle = computed(() => {
  // 客户状态：1-正常，2-公海，3-垃圾
  // 如果客户状态是公海（2），显示"移出公海"，否则显示"移入公海"
  const status = props.customerStatus !== undefined ? props.customerStatus : currentCustomerStatus.value;
  return status === 2 ? '移出公海' : '移入公海';
});

// 判断是否是移出公海操作
const isMoveOut = computed(() => {
  const status = props.customerStatus !== undefined ? props.customerStatus : currentCustomerStatus.value;
  return status === 2;
});

const form = ref({
  owner_user_id: '', // 归属人ID
  desc: '', // 备注信息
});

// 加载人员列表
const loadPersonnelOptions = async () => {
  // 如果已经有数据，不再重复加载
  if (personnelOptions.value.length > 0) {
    return;
  }

  loadingPersonnel.value = true;
  try {
    const response = await getEmployeeList({
      limit: 1000, // 获取所有员工
    });
    if (response.code === 0 || response.code === 200) {
      // response.data 直接是数组，不是 { list: [] } 对象
      const data = response.data || [];
      personnelOptions.value = data
        .map((item: any) => ({
          label: item.real_name || '',
          value: item.id || '',
        }))
        .filter((item: any) => item.label && item.value); // 过滤掉空值
    }
  } catch (error) {
    console.error('获取人员列表失败:', error);
    MessagePlugin.error('获取人员列表失败，请重试');
  } finally {
    loadingPersonnel.value = false;
  }
};

const show = (ids: (string | number)[] | string | number, status?: number, ownerUserId?: number | string) => {
  // 保存客户状态（优先使用传入的 status，其次使用 props.customerStatus）
  if (status !== undefined) {
    currentCustomerStatus.value = status;
  } else if (props.customerStatus !== undefined) {
    currentCustomerStatus.value = props.customerStatus;
  }
  // 深拷贝数组，避免引用问题
  if (props.isMultiple) {
    customerIds.value = Array.isArray(ids) && ids.length > 0 ? [...ids] : [];
  } else {
    customerIds.value = Array.isArray(ids) ? [...ids] : [ids];
  }
  dialogFormVisible.value = true;
  // 设置默认归属人（优先使用传入的 ownerUserId，其次使用 props.ownerUserId）
  form.value.owner_user_id = ownerUserId || props.ownerUserId || '';
  form.value.desc = '';
  // 如果是移出公海，加载人员列表
  if (currentCustomerStatus.value === 2) {
    loadPersonnelOptions();
  }
};

const handleConfirm = async () => {
  if (props.isMultiple) {
    if (!customerIds.value || customerIds.value.length === 0) {
      const actionText = isMoveOut.value ? '移出公海' : '移入公海';
      MessagePlugin.warning(`请先选择要${actionText}的客户`);
      return;
    }
  }
  // 移出公海时，验证归属人是否已选择
  if (isMoveOut.value && !form.value.owner_user_id) {
    MessagePlugin.warning('请选择归属人');
    return;
  }
  loading.value = true;
  try {
    let response;
    if (isMoveOut.value) {
      // 移出公海
      response = await moveOutPublicSea(customerIds.value, form.value.desc, form.value.owner_user_id);
    } else {
      // 移入公海
      response = await moveToPublicSea(customerIds.value, form.value.desc);
    }
    if (response.code === 0 || response.code === 200) {
      const actionText = isMoveOut.value ? '移出公海' : '移入公海';
      MessagePlugin.success(`${actionText}成功`);
      dialogFormVisible.value = false;
      emit('success');
    } else {
      const actionText = isMoveOut.value ? '移出公海' : '移入公海';
      MessagePlugin.error(response.message || response.msg || `${actionText}失败`);
    }
  } catch (error: any) {
    console.error('操作失败:', error);
    const actionText = isMoveOut.value ? '移出公海' : '移入公海';
    MessagePlugin.error(error.message || `${actionText}失败，请重试`);
  } finally {
    loading.value = false;
  }
};

// 组件挂载时加载人员列表（如果需要）
onMounted(() => {
  // 如果初始状态是移出公海，加载人员列表
  if (props.customerStatus === 2) {
    loadPersonnelOptions();
  }
});

defineExpose({
  show,
});
</script>
<style lang="less" scoped>
.tisi {
  margin-top: 10px;
}
</style>
