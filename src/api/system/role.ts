import { request } from '@/utils/request';

export interface SystemRoleItem {
  id: number | string;
  role_name: string;
  data_scope: string;
  create_time: string;
  [key: string]: any;
}

export interface SystemRoleListParams {
  role_name?: string;
  data_scope?: string;
  page?: number;
  limit?: number;
}

export interface SystemRoleListResponse {
  code: number;
  msg?: string;
  count?: number;
  data?: SystemRoleItem[];
}

// 角色列表：system/role/list
export const getSystemRoleList = (params: SystemRoleListParams) => {
  return request.get<SystemRoleListResponse>({
    url: '/api/system/role/list',
    params,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 保存角色（新增 / 编辑）：system/role/save
export interface SaveSystemRoleParams {
  id?: number | string; // 角色ID（编辑时必传）
  role_name: string; // 角色名称
  data_scope?: string; // 数据范围，默认 self
}

export const saveSystemRole = (data: SaveSystemRoleParams) => {
  return request.post<any>({
    url: '/api/system/role/save',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
export const deleteSystemRole = (id: number | string) => {
  return request.post<any>({
    url: '/api/system/role/del',
    data: { id },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 获取角色权限：system/role/permission
export const getRolePermission = (roleId: number | string) => {
  return request.get<any>({
    url: '/api/system/role/permission',
    params: { role_id: roleId },
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};

// 保存角色权限：system/permission/save
export interface SavePermissionParams {
  role_id: number | string; // 角色ID（必传）
  menu_ids: (number | string)[] | string; // 菜单ID数组或逗号分隔的字符串
}

export const savePermission = (data: SavePermissionParams) => {
  return request.post<any>({
    url: '/api/system/permission/save',
    data,
    requestOptions: {
      isTransformResponse: false,
      withToken: true,
    },
  } as any);
};
