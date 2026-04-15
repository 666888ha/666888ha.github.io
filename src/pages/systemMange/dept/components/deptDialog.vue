<template>
  <t-dialog
    v-model:visible="visible"
    :header="isEdit ? '编辑部门' : '添加部门'"
    :width="600"
    :confirm-loading="confirmLoading"
    :destroy-on-close="true"
    :close-on-overlay-click="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <t-form ref="formRef" :data="formData" :rules="rules" label-align="right" :label-width="120">
      <t-form-item label="部门名称" name="dept_name">
        <t-input v-model="formData.dept_name" maxlength="50" placeholder="请输入部门名称" />
      </t-form-item>
      <!-- <t-form-item label="父部门" name="parent_id">
        <t-select
          v-model="formData.parent_id"
          :options="parentDeptOptions"
          placeholder="请选择父部门（0为顶级）"
          clearable
          :loading="loadingDeptTree"
        />
      </t-form-item> -->
      <t-form-item label="排序" name="sort">
        <t-input-number v-model="formData.sort" :min="0" theme="column" placeholder="请输入排序" style="width: 100%" />
      </t-form-item>
      <t-form-item label="部门负责人" name="leader">
        <t-input v-model="formData.leader" maxlength="50" placeholder="请输入部门负责人" />
      </t-form-item>
      <t-form-item label="联系电话" name="phone">
        <t-input v-model="formData.phone" maxlength="11" placeholder="请输入联系电话" />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { SystemDeptItem } from '@/api/system/dept';
import { getSystemDeptList, saveSystemDept } from '@/api/system/dept';
import { handleTree } from '@/utils/ruoyi';

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstanceFunctions>();
const visible = ref(false);
const confirmLoading = ref(false);
const loadingDeptTree = ref(false);
const deptTreeOptions = ref<SystemDeptItem[]>([]);
const parentDeptOptions = ref<Array<{ label: string; value: number | string }>>([]);

const formData = ref({
  id: undefined as number | string | undefined,
  dept_name: '',
  parent_id: 0,
  sort: 0,
  leader: '',
  phone: '',
});

const isEdit = computed(() => !!formData.value.id);

const rules: Record<string, FormRule[]> = {
  dept_name: [{ required: true, message: '请输入部门名称', type: 'error' }],
  // parent_id: [{ required: true, message: '请选择父部门', type: 'error' }],
};

// 获取所有子部门ID（包括子部门的子部门）
const getAllChildrenIds = (dept: SystemDeptItem): (number | string)[] => {
  const ids: (number | string)[] = [dept.id];
  if (dept.children && dept.children.length > 0) {
    dept.children.forEach((child) => {
      ids.push(...getAllChildrenIds(child));
    });
  }
  return ids;
};

// 将树形数据扁平化为选项列表（用于下拉选择）
const flattenDeptTree = (
  tree: SystemDeptItem[],
  excludeIds: (number | string)[] = [],
  level = 0,
): Array<{ label: string; value: number | string }> => {
  const result: Array<{ label: string; value: number | string }> = [];
  tree.forEach((item) => {
    // 排除当前编辑的部门及其子部门
    if (excludeIds.includes(item.id)) {
      return;
    }
    const prefix = '  '.repeat(level); // 使用空格缩进表示层级
    result.push({
      label: `${prefix}${item.dept_name}`,
      value: item.id,
    });
    if (item.children && item.children.length > 0) {
      result.push(...flattenDeptTree(item.children, excludeIds, level + 1));
    }
  });
  return result;
};

// 加载部门树形数据
const loadDeptTree = async (excludeDeptId?: number | string) => {
  loadingDeptTree.value = true;
  try {
    const res = await getSystemDeptList();
    if (res.code === 0 || res.code === 200) {
      const data = res.data || [];
      // 将扁平数据转换为树形结构
      deptTreeOptions.value = handleTree<SystemDeptItem>(data, 'id', 'parent_id', 'children');

      // 如果编辑模式，需要排除当前部门及其子部门
      let excludeIds: (number | string)[] = [];
      if (excludeDeptId) {
        // 找到当前编辑的部门
        const findDept = (tree: SystemDeptItem[]): SystemDeptItem | null => {
          for (const item of tree) {
            if (item.id === excludeDeptId) {
              return item;
            }
            if (item.children && item.children.length > 0) {
              const found = findDept(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        const currentDept = findDept(deptTreeOptions.value);
        if (currentDept) {
          excludeIds = getAllChildrenIds(currentDept);
        }
      }

      // 转换为下拉选项，添加"顶级部门"选项
      parentDeptOptions.value = [
        { label: '顶级部门(0)', value: 0 },
        ...flattenDeptTree(deptTreeOptions.value, excludeIds),
      ];
    }
  } catch (error: any) {
    console.error('获取部门树失败:', error);
  } finally {
    loadingDeptTree.value = false;
  }
};

// 外部调用：显示弹框（可带上行数据用于编辑，或父部门用于新增子部门）
const show = (record?: SystemDeptItem, parentDept?: SystemDeptItem) => {
  if (record) {
    // 编辑模式
    formData.value = {
      id: record.id,
      dept_name: record.dept_name || '',
      parent_id: record.parent_id || 0,
      sort: record.sort || 0,
      leader: record.leader || '',
      phone: record.phone || '',
    };
    loadDeptTree(record.id); // 加载部门树，排除当前部门及其子部门
  } else {
    // 新增模式
    formData.value = {
      id: undefined,
      dept_name: '',
      parent_id: parentDept ? parentDept.id : 0, // 如果有父部门，默认选择父部门
      sort: 0,
      leader: '',
      phone: '',
    };
    loadDeptTree(); // 加载部门树
  }
  visible.value = true;
};

const handleConfirm = async () => {
  const result = await formRef.value?.validate();
  if (result !== true) return;

  confirmLoading.value = true;
  try {
    const payload: any = {
      dept_name: formData.value.dept_name.trim(),
      parent_id: String(formData.value.parent_id || 0), // 转为字符串
      sort: String(formData.value.sort || 0), // 转为字符串
      leader: formData.value.leader?.trim() || '',
      phone: formData.value.phone?.trim() || '',
    };

    // 编辑模式需要传id
    if (isEdit.value && formData.value.id) {
      payload.id = String(formData.value.id); // 转为字符串
    }

    const res = await saveSystemDept(payload);
    if (res && (res.code === 0 || res.code === 200)) {
      MessagePlugin.success(res.msg || '操作成功');
      visible.value = false;
      emit('success');
    } else {
      MessagePlugin.error(res?.msg || '操作失败');
    }
  } catch (error: any) {
    console.error('保存部门失败:', error);
    MessagePlugin.error(error?.response?.data?.msg || error?.message || '保存失败，请重试');
  } finally {
    confirmLoading.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

onMounted(() => {
  loadDeptTree();
});

defineExpose({
  show,
});
</script>
<style scoped lang="less">
::v-deep(.t-dialog__body) {
  padding-top: 12px;
}
</style>
