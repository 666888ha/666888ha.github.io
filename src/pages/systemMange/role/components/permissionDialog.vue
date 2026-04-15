<template>
  <t-dialog
    v-model:visible="visible"
    :header="`编辑[${roleName}]权限`"
    width="600px"
    :footer="null"
    @close="handleClose"
  >
    <div class="permission-dialog">
      <!-- 权限树 -->
      <div class="permission-tree">
        <t-tree
          v-model="checkedKeys"
          :data="menuTreeData"
          :keys="treeKeys"
          :check-props="checkProps"
          :checkable="true"
          @change="handleTreeChange"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="dialog-footer">
        <t-button variant="outline" @click="handleClose">取消</t-button>
        <t-button theme="primary" :loading="loading" @click="handleSubmit">确认</t-button>
      </div>
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getMenuList } from '@/api/system/menu';
import { getRolePermission, savePermission } from '@/api/system/role';
// 组件事件
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();
// 加载状态
const loading = ref(false);

// 选中的菜单ID
const checkedKeys = ref<(string | number)[]>([]);

// 树节点配置
const checkProps = {
  checkAll: true,
  checkedKeys,
  expandAll: true,
};

// 树节点唯一标识
const treeKeys = {
  label: 'title',
  value: 'id',
  children: 'children',
};

// 处理菜单路由数据，转换为树结构
const menuTreeData = ref<any[]>([]);

// 转换菜单数据为树结构
const transformMenuDataToTree = (menus: any[]): any[] => {
  if (!menus || !Array.isArray(menus)) {
    return [];
  }

  // 直接处理树形结构数据
  return menus.map((menu) => ({
    id: menu.id,
    parent_id: menu.parent_id,
    title: menu.menu_name, // 确保使用 title 字段，符合 TDesign 树组件要求
    path: menu.menu_url,
    children: menu.children ? transformMenuDataToTree(menu.children) : [],
  }));
};

// 初始化菜单树数据
const initMenuTreeData = async () => {
  try {
    const response = await getMenuList();
    if (response.code === 0 || response.code === 200) {
      const menus = response.data || [];
      menuTreeData.value = transformMenuDataToTree(menus);
    }
  } catch (error: any) {
    console.error('获取菜单列表失败:', error);
    MessagePlugin.error(error.message || '获取菜单列表失败，请重试');
  }
};

// 处理树节点变化
const handleTreeChange = (value: (string | number)[]) => {
  checkedKeys.value = value;
};

// 提交权限
const handleSubmit = async () => {
  loading.value = true;

  try {
    const response = await savePermission({
      role_id: roleId.value,
      menu_ids: checkedKeys.value,
    });

    if (response.code === 0 || response.code === 200) {
      emit('success');
      handleClose();
    } else {
      MessagePlugin.error(response.msg || response.message || '权限保存失败');
    }
  } catch (error: any) {
    console.error('保存权限失败:', error);
    MessagePlugin.error(error.message || '权限保存失败，请重试');
  } finally {
    loading.value = false;
  }
};

const visible = ref(false);
const roleId = ref<number | string | null>(null);
const roleName = ref<string | null>(null);
const show = async (data: { roleId: number | string; roleName: string }) => {
  visible.value = true;
  roleId.value = data.roleId;
  roleName.value = data.roleName;
  // 显示弹框时先加载菜单树数据，然后加载角色权限
  await initMenuTreeData();
  if (data.roleId) {
    loadRolePermission(data.roleId);
  }
};
// 关闭弹框
const handleClose = () => {
  visible.value = false;
  // 重置状态
  checkedKeys.value = [];
};

// 加载角色权限
const loadRolePermission = async (roleId: number | string) => {
  try {
    const response = await getRolePermission(roleId);
    if (response.code === 0 || response.code === 200) {
      const checkedMenuIds = response.checkedMenuIds || [];
      checkedKeys.value = checkedMenuIds;
    }
  } catch (error: any) {
    console.error('获取角色权限失败:', error);
    MessagePlugin.error(error.message || '获取角色权限失败，请重试');
  }
};

// 初始化
onMounted(() => {
  // 不需要在挂载时初始化，因为会在 show 函数中调用
});
defineExpose({
  show,
});
</script>
<style scoped lang="less">
.permission-dialog {
  .permission-tree {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 20px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
