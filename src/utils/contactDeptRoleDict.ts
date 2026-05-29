import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';

import { getDictOptions } from '@/api/dic';

export type ContactDeptRoleOption = { label: string; value: string | number };

/**
 * 联系人「部门职务」：与 /api/dict/options?type=contact_dept_role 一致
 */
export function useContactDeptRoleOptions() {
  const departmentOptions = ref<ContactDeptRoleOption[]>([]);
  const loadingDepartmentRole = ref(false);

  const loadContactDeptRoleOptions = async () => {
    if (loadingDepartmentRole.value) {
      return;
    }
    loadingDepartmentRole.value = true;
    try {
      const res = await getDictOptions('contact_dept_role', false);
      if (res.code === 0 || res.code === 200) {
        departmentOptions.value = (res.data || []) as ContactDeptRoleOption[];
      } else {
        departmentOptions.value = [];
        MessagePlugin.error((res as any).msg || (res as any).message || '获取部门职务失败');
      }
    } catch (e) {
      console.error(e);
      departmentOptions.value = [];
      MessagePlugin.error('获取部门职务失败，请重试');
    } finally {
      loadingDepartmentRole.value = false;
    }
  };

  return { departmentOptions, loadingDepartmentRole, loadContactDeptRoleOptions };
}
