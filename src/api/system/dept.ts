import { request } from '@/utils/request';

export interface SystemDeptItem {
  id: number | string;
  dept_name: string;
  parent_id: number | string;
  sort: number;
  leader?: string;
  phone?: string;
  status: number;
  create_time: string;
  children?: SystemDeptItem[];
  [key: string]: any;
}

// 部门列表（树形结构）：system/dept/list
export const getSystemDeptList = () => {
  return request.get<any>({
    url: '/api/system/dept/list',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 保存部门（新增/编辑）：system/dept/save
export interface SaveSystemDeptParams {
  id?: number | string; // 部门ID（编辑时必传）
  dept_name: string; // 部门名称(唯一)
  parent_id: number | string; // 父部门ID (0为顶级)
  sort?: number; // 排序,默认 0
  leader?: string; // 部门负责人
  phone?: string; // 部门联系电话
}

export const saveSystemDept = (data: SaveSystemDeptParams) => {
  return request.post<any>({
    url: '/api/system/dept/save',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 删除部门：system/dept/del
export const deleteSystemDept = (id: number | string) => {
  return request.post<any>({
    url: '/api/system/dept/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 获取部门选项（下拉选择用）：system/dept/options
export const getSystemDeptOptions = () => {
  return request.get<any>({
    url: '/api/system/dept/options',
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
